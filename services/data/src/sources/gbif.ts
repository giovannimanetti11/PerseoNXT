import type { ClassificationRank, CommonName, Distribution, ScientificName } from '../types.js'
import { collapseSpaces } from '../normalize/text.js'
import type { SourceContext } from './context.js'

const API = 'https://api.gbif.org/v1'
export const gbifSpeciesUrl = (key: number) => `https://www.gbif.org/species/${key}`

// ---------------------------------------------------------------------------
// Raw shapes (only the fields we read)
// ---------------------------------------------------------------------------

export interface GbifMatch {
  usageKey?: number
  acceptedUsageKey?: number
  scientificName?: string
  canonicalName?: string
  rank?: string
  status?: string
  matchType?: 'EXACT' | 'FUZZY' | 'HIGHERRANK' | 'NONE'
  confidence?: number
  kingdom?: string
  phylum?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  species?: string
}

export interface GbifSpecies {
  key: number
  scientificName?: string
  canonicalName?: string
  authorship?: string
  basionym?: string | null
  basionymKey?: number | null
  taxonomicStatus?: string
}

export interface GbifNameUsage {
  key: number
  scientificName?: string
  canonicalName?: string
  authorship?: string
  taxonomicStatus?: string
  rank?: string
}

interface GbifPage<T> {
  results?: T[]
  endOfRecords?: boolean
}

export interface GbifVernacular {
  vernacularName?: string
  language?: string
}

export interface GbifOccurrenceFacets {
  count?: number
  facets?: { field: string; counts: { name: string; count: number }[] }[]
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

export interface GbifTaxon {
  key: number
  canonical: string
  authorship: string
  family: string
  classification: ClassificationRank[]
}

const RANKS: ClassificationRank['rank'][] = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species']

/**
 * Accepts only exact or fuzzy species-level matches. Higher-rank matches
 * ("the genus Curcuma") would attach the wrong data to the plant.
 */
export function parseMatch(match: GbifMatch): { key: number; synonymOf: number | null } | null {
  if (!match.usageKey || (match.matchType !== 'EXACT' && match.matchType !== 'FUZZY')) return null
  if (match.rank && !['SPECIES', 'SUBSPECIES', 'VARIETY', 'FORM'].includes(match.rank)) return null
  const synonymOf = match.status === 'SYNONYM' || match.status === 'HETEROTYPIC_SYNONYM' || match.status === 'HOMOTYPIC_SYNONYM'
    ? match.acceptedUsageKey ?? null
    : null
  return { key: match.usageKey, synonymOf }
}

export function parseTaxon(match: GbifMatch, species: GbifSpecies): GbifTaxon {
  return {
    key: species.key,
    canonical: collapseSpaces(species.canonicalName ?? match.canonicalName ?? ''),
    authorship: collapseSpaces(species.authorship ?? ''),
    family: match.family ?? '',
    classification: RANKS.flatMap((rank) => {
      const name = match[rank]
      return typeof name === 'string' && name ? [{ rank, name }] : []
    }),
  }
}

export function parseSynonyms(page: GbifPage<GbifNameUsage>): ScientificName[] {
  return (page.results ?? [])
    .filter((usage) => usage.taxonomicStatus?.includes('SYNONYM') && usage.canonicalName)
    .map((usage) => ({
      canonical: collapseSpaces(usage.canonicalName ?? ''),
      authorship: collapseSpaces(usage.authorship ?? ''),
      kind: 'synonym' as const,
      sources: [{ source: 'gbif' as const, url: gbifSpeciesUrl(usage.key) }],
    }))
}

export function parseBasionym(species: GbifSpecies): ScientificName | null {
  if (!species.basionym || !species.basionymKey) return null
  const full = collapseSpaces(species.basionym)
  // GBIF only gives the full string here; a species basionym is a binomial,
  // so the first two words are the name and the rest is the authorship.
  const parts = full.split(' ')
  const canonical = parts.slice(0, 2).join(' ')
  return {
    canonical,
    authorship: parts.slice(2).join(' '),
    kind: 'basionym',
    sources: [{ source: 'gbif', url: gbifSpeciesUrl(species.basionymKey) }],
  }
}

const LANGUAGES: Record<string, string> = { ita: 'it', eng: 'en' }

export function parseVernacular(page: GbifPage<GbifVernacular>, key: number): CommonName[] {
  return (page.results ?? []).flatMap((item) => {
    const lang = LANGUAGES[item.language ?? '']
    const name = collapseSpaces(item.vernacularName ?? '')
    return lang && name ? [{ name, lang, sources: [{ source: 'gbif' as const, url: gbifSpeciesUrl(key) }] }] : []
  })
}

export function parseOccurrences(data: GbifOccurrenceFacets): Omit<Distribution, 'inaturalistObservations'> {
  const facet = (field: string) => data.facets?.find((item) => item.field === field)?.counts ?? []
  const currentYear = new Date().getUTCFullYear()
  return {
    occurrences: data.count ?? 0,
    countries: facet('COUNTRY')
      .filter((item) => /^[A-Z]{2}$/.test(item.name))
      .map((item) => ({ code: item.name, count: item.count }))
      .sort((a, b) => b.count - a.count),
    byYear: facet('YEAR')
      .map((item) => ({ year: Number(item.name), count: item.count }))
      .filter((item) => Number.isInteger(item.year) && item.year >= 1900 && item.year <= currentYear)
      .sort((a, b) => a.year - b.year),
  }
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export async function fetchGbifTaxonomy(ctx: SourceContext, scientificName: string) {
  const match = await ctx.get<GbifMatch>('gbif', 'match', `${API}/species/match`, { query: { name: scientificName, verbose: false } })
  const parsed = parseMatch(match)
  if (!parsed) return null
  // A synonym match is followed to the accepted name.
  const key = parsed.synonymOf ?? parsed.key
  const acceptedMatch = parsed.synonymOf
    ? await ctx.get<GbifMatch>('gbif', 'match-accepted', `${API}/species/${key}`)
    : match
  const [species, synonyms, vernacular] = await Promise.all([
    ctx.get<GbifSpecies>('gbif', 'species', `${API}/species/${key}`),
    ctx.get<GbifPage<GbifNameUsage>>('gbif', 'synonyms', `${API}/species/${key}/synonyms`, { query: { limit: 1000 } }),
    ctx.get<GbifPage<GbifVernacular>>('gbif', 'vernacular', `${API}/species/${key}/vernacularNames`, { query: { limit: 1000 } }),
  ])
  return {
    taxon: parseTaxon(acceptedMatch, species),
    basionym: parseBasionym(species),
    synonyms: parseSynonyms(synonyms),
    commonNames: parseVernacular(vernacular, key),
  }
}

export async function fetchGbifOccurrences(ctx: SourceContext, key: number) {
  const data = await ctx.get<GbifOccurrenceFacets>('gbif', 'occurrence-facets', `${API}/occurrence/search`, {
    query: { taxonKey: key, limit: 0, facet: 'country', 'country.facetLimit': 300, 'year.facetLimit': 200 },
  })
  // The year facet needs a second facet parameter, which URLSearchParams.set cannot repeat.
  const years = await ctx.get<GbifOccurrenceFacets>('gbif', 'occurrence-years', `${API}/occurrence/search`, {
    query: { taxonKey: key, limit: 0, facet: 'year', 'year.facetLimit': 200 },
  })
  return parseOccurrences({ count: data.count, facets: [...(data.facets ?? []), ...(years.facets ?? [])] })
}
