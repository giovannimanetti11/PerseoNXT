import type { Database } from '../db/index.js'
import type { plants } from '../db/schema.js'
import type { HttpClient } from '../http/client.js'
import { mergeBasionym, mergeCommonNames, mergeCompounds, mergeSynonyms } from '../normalize/merge.js'
import { binomial } from '../normalize/text.js'
import { fetchCol, fetchWfo } from '../sources/checklists.js'
import { createContext, type Recorder, type SourceContext } from '../sources/context.js'
import { fetchTrials } from '../sources/ctgov.js'
import { fetchGbifOccurrences, fetchGbifTaxonomy } from '../sources/gbif.js'
import { fetchInaturalist, type InatTaxonData } from '../sources/inaturalist.js'
import { fetchLiterature } from '../sources/literature.js'
import { fetchPubchemProperties } from '../sources/pubchem.js'
import { fetchWikidataCompounds, fetchWikidataTaxon, findTaxonQid, type WikidataTaxon } from '../sources/wikidata.js'
import { fetchCommonsImages, fetchWikipediaSummary } from '../sources/wikimedia.js'
import type { CommonName, DataArea, Distribution, ExternalIds, MediaItem, Taxonomy, TrialSummary } from '../types.js'
import { failArea, replaceCompounds, replaceMedia, replacePublications, replaceTrials, saveArea, saveResolution } from './store.js'

type PlantRow = typeof plants.$inferSelect
type Area = DataArea | 'summary'

export interface AreaOutcome {
  area: Area
  ok: boolean
  detail: string
}

export interface PlantOutcome {
  slug: string
  resolved: boolean
  note: string | null
  areas: AreaOutcome[]
}

const MAX_MEDIA = 12

/** Fail-soft wrapper for optional sources inside an area. */
async function optional<T>(task: () => Promise<T>): Promise<T | null> {
  try {
    return await task()
  } catch {
    return null
  }
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error)).slice(0, 300)

interface Resolution {
  taxonomy: Taxonomy | null
  gbifKey: number | null
  commonNames: CommonName[]
  wikidata: WikidataTaxon | null
  note: string | null
}

/**
 * Identity of the taxon. GBIF is required: without an exact species match the
 * plant stays unresolved and only the text searches (literature, trials) run.
 */
async function resolve(ctx: SourceContext, scientificName: string): Promise<Resolution> {
  // Some WordPress names carry the drug part ("Ribes nigrum L. folium"): retry with the binomial.
  const shortName = binomial(scientificName)
  const gbif = await fetchGbifTaxonomy(ctx, scientificName)
    ?? (shortName !== scientificName ? await fetchGbifTaxonomy(ctx, shortName) : null)
  if (!gbif) {
    return { taxonomy: null, gbifKey: null, commonNames: [], wikidata: null, note: `GBIF: nessuna corrispondenza a livello di specie per "${scientificName}"` }
  }
  const accepted = gbif.taxon.canonical
  const [wfo, col, qid] = await Promise.all([
    optional(() => fetchWfo(ctx, accepted)),
    optional(() => fetchCol(ctx, accepted)),
    optional(() => findTaxonQid(ctx, gbif.taxon.key, accepted)),
  ])
  const wikidata = qid ? await optional(() => fetchWikidataTaxon(ctx, qid)) : null

  const ids: ExternalIds = {
    gbif: gbif.taxon.key,
    ...(wfo ? { wfo: wfo.id } : {}),
    ...(col?.match.accepted ? { col: col.match.id } : {}),
    ...(wikidata ? { wikidata: wikidata.qid } : {}),
    ...(wikidata?.ncbi ? { ncbi: wikidata.ncbi } : {}),
    ...(wikidata?.inaturalist ? { inaturalist: wikidata.inaturalist } : {}),
  }
  const basionym = mergeBasionym([gbif.basionym])
  const notes = [
    !wfo && 'WFO: nessuna corrispondenza univoca',
    col && !col.match.accepted && 'Catalogue of Life: il nome risulta sinonimo',
    !wikidata && 'Wikidata: elemento non trovato',
  ].filter((note): note is string => typeof note === 'string')

  return {
    taxonomy: {
      acceptedName: accepted,
      authorship: gbif.taxon.authorship,
      family: gbif.taxon.family,
      classification: gbif.taxon.classification,
      basionym,
      synonyms: mergeSynonyms([gbif.synonyms, col?.synonyms ?? []], accepted, basionym),
      ids,
    },
    gbifKey: gbif.taxon.key,
    commonNames: [...gbif.commonNames, ...(wikidata?.commonNames ?? [])],
    wikidata,
    note: notes.length ? notes.join('; ') : null,
  }
}

async function storeTrials(db: Database, ctx: SourceContext, plantId: number, searchName: string): Promise<string> {
  const summary: TrialSummary = await fetchTrials(ctx, searchName)
  await replaceTrials(db, plantId, summary.items)
  const { items: _items, ...counts } = summary
  await saveArea(db, plantId, 'trials', counts)
  return `${summary.total} studi`
}

/** Trials only, for a quick refresh after the trial schema changes. */
export async function collectTrials(db: Database, http: HttpClient, recorder: Recorder, plant: PlantRow): Promise<string> {
  const ctx = createContext(http, recorder, plant.slug, '')
  return storeTrials(db, ctx, plant.id, binomial(plant.acceptedName ?? plant.scientificName))
}

export async function collectPlant(db: Database, http: HttpClient, recorder: Recorder, plant: PlantRow, ncbiApiKey: string): Promise<PlantOutcome> {
  const ctx = createContext(http, recorder, plant.slug, ncbiApiKey)
  const areas: AreaOutcome[] = []

  async function area(name: Area, task: () => Promise<string>): Promise<void> {
    try {
      areas.push({ area: name, ok: true, detail: await task() })
    } catch (error) {
      await failArea(db, plant.id, name, message(error))
      areas.push({ area: name, ok: false, detail: message(error) })
    }
  }

  let resolution: Resolution = { taxonomy: null, gbifKey: null, commonNames: [], wikidata: null, note: null }
  await area('taxonomy', async () => {
    resolution = await resolve(ctx, plant.scientificName)
    const { taxonomy } = resolution
    await saveResolution(db, plant.id, {
      status: taxonomy ? 'resolved' : 'unresolved',
      note: resolution.note,
      acceptedName: taxonomy?.acceptedName ?? null,
      family: taxonomy?.family ?? null,
      ids: taxonomy?.ids ?? {},
    })
    if (!taxonomy) throw new Error(resolution.note ?? 'Taxon non risolto')
    await saveArea(db, plant.id, 'taxonomy', taxonomy)
    return `${taxonomy.synonyms.length} sinonimi`
  })

  const { taxonomy, wikidata, gbifKey } = resolution
  const searchName = binomial(taxonomy?.acceptedName ?? plant.scientificName)

  if (wikidata) {
    await area('compounds', async () => {
      const items = await fetchWikidataCompounds(ctx, wikidata.qid)
      const pubchem = await fetchPubchemProperties(ctx, items.map((item) => item.pubchemCid).filter((cid): cid is number => cid !== null))
      const merged = mergeCompounds(items, pubchem)
      await replaceCompounds(db, plant.id, merged)
      await saveArea(db, plant.id, 'compounds', { total: merged.length })
      return `${merged.length} composti`
    })
  }

  await area('literature', async () => {
    const literature = await fetchLiterature(ctx, searchName)
    await replacePublications(db, plant.id, { review: literature.recentReviews, trial: literature.recentTrials })
    const { recentReviews: _reviews, recentTrials: _trials, ...counts } = literature
    await saveArea(db, plant.id, 'literature', counts)
    return `${literature.total} articoli`
  })

  await area('trials', () => storeTrials(db, ctx, plant.id, searchName))

  let inat: InatTaxonData | null = null
  if (taxonomy) {
    await area('distribution', async () => {
      inat = await optional(() => fetchInaturalist(ctx, taxonomy.acceptedName, taxonomy.ids.inaturalist ?? null))
      const occurrences = gbifKey ? await fetchGbifOccurrences(ctx, gbifKey) : null
      if (!occurrences) throw new Error('GBIF key mancante')
      const distribution: Distribution = { ...occurrences, inaturalistObservations: inat?.observations ?? null }
      await saveArea(db, plant.id, 'distribution', distribution)
      return `${distribution.occurrences} occorrenze in ${distribution.countries.length} paesi`
    })
  }

  await area('names', async () => {
    const inatNames = (inat as InatTaxonData | null)?.commonNames ?? []
    const names = mergeCommonNames([resolution.commonNames, inatNames], taxonomy?.acceptedName ?? plant.scientificName)
    await saveArea(db, plant.id, 'names', names)
    return `${names.length} nomi comuni`
  })

  await area('media', async () => {
    const commons: MediaItem[] = wikidata?.images.length ? await fetchCommonsImages(ctx, wikidata.images) : []
    const items = [...commons, ...((inat as InatTaxonData | null)?.photos ?? [])].slice(0, MAX_MEDIA)
    await replaceMedia(db, plant.id, items)
    await saveArea(db, plant.id, 'media', { total: items.length })
    return `${items.length} immagini`
  })

  if (wikidata?.itWikiTitle) {
    const title = wikidata.itWikiTitle
    await area('summary', async () => {
      const summary = await fetchWikipediaSummary(ctx, title)
      await saveArea(db, plant.id, 'summary', summary)
      return summary ? 'sintesi presente' : 'nessuna sintesi'
    })
  }

  return { slug: plant.slug, resolved: Boolean(taxonomy), note: resolution.note, areas }
}
