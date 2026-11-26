import type { CommonName } from '../types.js'
import { collapseSpaces, normalizeDoi } from '../normalize/text.js'
import type { SourceContext } from './context.js'

const SPARQL = 'https://query.wikidata.org/sparql'
/** Since the 2025 graph split, scholarly articles (and their DOIs) live in a separate endpoint. */
const SCHOLARLY_SPARQL = 'https://query-scholarly.wikidata.org/sparql'
const DOI_BATCH = 200
const API = 'https://www.wikidata.org/w/api.php'
export const wikidataUrl = (qid: string) => `https://www.wikidata.org/wiki/${qid}`

interface SparqlValue {
  type: string
  value: string
  'xml:lang'?: string
}

export interface SparqlResponse {
  results?: { bindings?: Record<string, SparqlValue | undefined>[] }
}

async function sparql(ctx: SourceContext, requestKey: string, query: string, endpoint = SPARQL): Promise<SparqlResponse> {
  return ctx.get<SparqlResponse>('wikidata', requestKey, endpoint, {
    method: 'POST',
    headers: { Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ query, format: 'json' }).toString(),
  })
}

const qidOf = (uri: string | undefined) => uri?.match(/Q\d+$/)?.[0] ?? null

export function parseQids(data: SparqlResponse): string[] {
  const ids = (data.results?.bindings ?? []).map((row) => qidOf(row.t?.value)).filter((id): id is string => Boolean(id))
  return [...new Set(ids)]
}

/**
 * The taxon item, looked up by GBIF key first: a lookup by name alone can hit
 * lexemes or homonyms (it returned a lexeme sense for "Curcuma longa").
 */
export async function findTaxonQid(ctx: SourceContext, gbifKey: number | null, scientificName: string): Promise<string | null> {
  if (gbifKey) {
    const byKey = parseQids(await sparql(ctx, 'qid-by-gbif', `SELECT ?t WHERE { ?t wdt:P846 "${gbifKey}" }`))
    if (byKey.length === 1) return byKey[0] ?? null
  }
  const safeName = scientificName.replace(/["\\]/g, '')
  const byName = parseQids(await sparql(ctx, 'qid-by-name', `SELECT ?t WHERE { ?t wdt:P225 "${safeName}" ; wdt:P31 wd:Q16521 }`))
  return byName.length === 1 ? (byName[0] ?? null) : null
}

// ---------------------------------------------------------------------------
// Entity: identifiers, images, common names, Wikipedia article
// ---------------------------------------------------------------------------

interface Claim {
  mainsnak?: { datavalue?: { value?: unknown } }
  rank?: 'preferred' | 'normal' | 'deprecated'
}

export interface EntitiesResponse {
  entities?: Record<string, {
    id?: string
    claims?: Record<string, Claim[]>
    sitelinks?: Record<string, { title?: string }>
  }>
}

export interface WikidataTaxon {
  qid: string
  ncbi: string | null
  inaturalist: number | null
  images: string[]
  itWikiTitle: string | null
  commonNames: CommonName[]
}

function claimValues(claims: Record<string, Claim[]> | undefined, property: string): unknown[] {
  return (claims?.[property] ?? [])
    .filter((claim) => claim.rank !== 'deprecated')
    .map((claim) => claim.mainsnak?.datavalue?.value)
    .filter((value) => value !== undefined)
}

const isMonolingual = (value: unknown): value is { text: string; language: string } =>
  typeof value === 'object' && value !== null && 'text' in value && 'language' in value
  && typeof value.text === 'string' && typeof value.language === 'string'

export function parseEntity(data: EntitiesResponse, qid: string): WikidataTaxon | null {
  const entity = data.entities?.[qid]
  if (!entity?.id) return null
  const strings = (property: string) => claimValues(entity.claims, property).filter((value): value is string => typeof value === 'string')
  const inat = Number(strings('P3151')[0])
  return {
    qid,
    ncbi: strings('P685')[0] ?? null,
    inaturalist: Number.isInteger(inat) && inat > 0 ? inat : null,
    images: strings('P18'),
    itWikiTitle: entity.sitelinks?.itwiki?.title ?? null,
    commonNames: claimValues(entity.claims, 'P1843')
      .filter(isMonolingual)
      .filter((value) => value.language === 'it' || value.language === 'en')
      .map((value) => ({ name: collapseSpaces(value.text), lang: value.language, sources: [{ source: 'wikidata' as const, url: wikidataUrl(qid) }] })),
  }
}

export async function fetchWikidataTaxon(ctx: SourceContext, qid: string): Promise<WikidataTaxon | null> {
  const data = await ctx.get<EntitiesResponse>('wikidata', 'entity', API, {
    query: { action: 'wbgetentities', format: 'json', ids: qid, props: 'claims|sitelinks', sitefilter: 'itwiki' },
  })
  return parseEntity(data, qid)
}

// ---------------------------------------------------------------------------
// Compounds found in the taxon (P703, mostly imported from LOTUS)
// ---------------------------------------------------------------------------

export interface WikidataCompound {
  wikidataId: string
  label: string
  inchikey: string | null
  pubchemCid: number | null
  /** DOIs of the reporting papers, filled by resolveReferenceDois. */
  references: string[]
  /** Wikidata items of the reporting papers ("stated in" of the P703 statement). */
  referenceItems: string[]
}

/** One row per compound and reference: merges rows by item and keeps every reference once. */
export function parseCompounds(data: SparqlResponse): WikidataCompound[] {
  const byItem = new Map<string, WikidataCompound>()
  for (const row of data.results?.bindings ?? []) {
    const qid = qidOf(row.c?.value)
    if (!qid) continue
    const current = byItem.get(qid) ?? { wikidataId: qid, label: '', inchikey: null, pubchemCid: null, references: [], referenceItems: [] }
    const label = row.cLabel?.value ?? ''
    // The label service falls back to the QID when no label exists.
    if (!current.label && label && label !== qid) current.label = collapseSpaces(label)
    if (!current.inchikey && row.ik?.value) current.inchikey = row.ik.value.trim().toUpperCase()
    const cid = Number(row.cid?.value)
    if (!current.pubchemCid && Number.isInteger(cid) && cid > 0) current.pubchemCid = cid
    const ref = qidOf(row.ref?.value)
    if (ref && !current.referenceItems.includes(ref)) current.referenceItems.push(ref)
    byItem.set(qid, current)
  }
  return [...byItem.values()]
}

export function parseDois(data: SparqlResponse): Map<string, string> {
  const result = new Map<string, string>()
  for (const row of data.results?.bindings ?? []) {
    const qid = qidOf(row.ref?.value)
    if (qid && row.doi?.value && !result.has(qid)) result.set(qid, normalizeDoi(row.doi.value))
  }
  return result
}

/** Looks up the DOIs of the reference items on the scholarly graph and writes them on each compound. */
export async function resolveReferenceDois(ctx: SourceContext, compounds: WikidataCompound[]): Promise<WikidataCompound[]> {
  const items = [...new Set(compounds.flatMap((compound) => compound.referenceItems))]
  const dois = new Map<string, string>()
  for (let start = 0; start < items.length; start += DOI_BATCH) {
    const batch = items.slice(start, start + DOI_BATCH)
    const data = await sparql(
      ctx,
      `dois:${start / DOI_BATCH}`,
      `SELECT ?ref ?doi WHERE { VALUES ?ref { ${batch.map((qid) => `wd:${qid}`).join(' ')} } ?ref wdt:P356 ?doi }`,
      SCHOLARLY_SPARQL,
    )
    for (const [qid, doi] of parseDois(data)) dois.set(qid, doi)
  }
  return compounds.map((compound) => ({
    ...compound,
    references: [...new Set(compound.referenceItems.flatMap((qid) => {
      const doi = dois.get(qid)
      return doi ? [doi] : []
    }))],
  }))
}

export async function fetchWikidataCompounds(ctx: SourceContext, qid: string): Promise<WikidataCompound[]> {
  const data = await sparql(ctx, 'compounds', `SELECT ?c ?cLabel ?ik ?cid ?ref WHERE {
    ?c p:P703 ?st . ?st ps:P703 wd:${qid} .
    OPTIONAL { ?c wdt:P235 ?ik }
    OPTIONAL { ?c wdt:P662 ?cid }
    OPTIONAL { ?st prov:wasDerivedFrom/pr:P248 ?ref }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "it,en". }
  }`)
  const compounds = parseCompounds(data)
  // Without DOIs the compounds are still useful: a failure here only drops the references.
  try {
    return await resolveReferenceDois(ctx, compounds)
  } catch {
    return compounds
  }
}
