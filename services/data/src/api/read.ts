import { and, asc, count, desc, eq, sql } from 'drizzle-orm'
import type { Database } from '../db/index.js'
import { compounds, media, plantAreas, plantCompounds, plantPublications, plants, plantTrials, publications, trials } from '../db/schema.js'
import { SOURCES } from '../sources/catalog.js'
import type {
  AreaFreshness, ClinicalTrial, CommonName, Compound, DataArea, Distribution, Literature, MediaItem, Page, PlantData,
  PlantListItem, Publication, SourceId, Summary, Taxonomy, TrialSummary,
} from '../types.js'

const AREAS: DataArea[] = ['taxonomy', 'compounds', 'literature', 'trials', 'distribution', 'names', 'media']
export const COMPOUNDS_PREVIEW = 30
const TRIALS_PREVIEW = 10

type PlantRow = typeof plants.$inferSelect
type CompoundRow = typeof compounds.$inferSelect
type PublicationRow = typeof publications.$inferSelect

const toCompound = (row: CompoundRow, references: string[]): Compound => ({
  inchikey: row.inchikey ?? '',
  pubchemCid: row.pubchemCid,
  wikidataId: row.wikidataId,
  name: row.name,
  formula: row.formula,
  molecularWeight: row.molecularWeight,
  iupacName: row.iupacName,
  references,
})

const toPublication = (row: PublicationRow): Publication => ({
  pmid: row.pmid,
  doi: row.doi,
  pmcid: row.pmcid,
  title: row.title,
  journal: row.journal,
  year: row.year,
  types: row.types,
  openAccess: row.openAccess,
  citations: row.citations,
  url: row.url,
  sources: row.sources,
})

const toTrial = (row: typeof trials.$inferSelect): ClinicalTrial => ({
  nctId: row.nctId,
  title: row.title,
  status: row.status,
  phases: row.phases,
  studyType: row.studyType,
  conditions: row.conditions,
  enrollment: row.enrollment,
  startDate: row.startDate,
  completionDate: row.completionDate,
  summary: row.summary,
  interventions: row.interventions,
  sponsor: row.sponsor,
  countries: row.countries,
  hasResults: row.hasResults,
  url: row.url,
})

const toMedia = (row: typeof media.$inferSelect): MediaItem => ({
  source: row.source,
  sourceId: row.sourceId,
  url: row.url,
  thumbnailUrl: row.thumbnailUrl,
  pageUrl: row.pageUrl,
  license: row.license,
  author: row.author,
  credit: row.credit,
})

export async function findActivePlant(db: Database, slug: string): Promise<PlantRow | null> {
  const [row] = await db.select().from(plants).where(and(eq(plants.slug, slug), eq(plants.active, true))).limit(1)
  return row ?? null
}

async function areaRows(db: Database, plantId: number) {
  const rows = await db.select().from(plantAreas).where(eq(plantAreas.plantId, plantId))
  return new Map(rows.map((row) => [row.area, row]))
}

export async function listCompounds(db: Database, plantId: number, offset: number, limit: number, search = ''): Promise<Page<Compound>> {
  const filter = search
    ? and(eq(plantCompounds.plantId, plantId), sql`(${compounds.name} ilike ${`%${search}%`} or ${compounds.formula} ilike ${`%${search}%`})`)
    : eq(plantCompounds.plantId, plantId)
  const [total] = await db.select({ value: count() }).from(plantCompounds).innerJoin(compounds, eq(compounds.id, plantCompounds.compoundId)).where(filter)
  const rows = await db.select({ compound: compounds, references: plantCompounds.references })
    .from(plantCompounds)
    .innerJoin(compounds, eq(compounds.id, plantCompounds.compoundId))
    .where(filter)
    // Most documented first; among equals short names first, which are usually common names rather than IUPAC strings.
    .orderBy(desc(sql`cardinality(${plantCompounds.references})`), asc(sql`length(${compounds.name})`), asc(compounds.name))
    .offset(offset)
    .limit(limit)
  return { total: total?.value ?? 0, offset, limit, items: rows.map((row) => toCompound(row.compound, row.references)) }
}

export async function listTrials(db: Database, plantId: number, offset: number, limit: number, status = ''): Promise<Page<ClinicalTrial>> {
  const where = status
    ? and(eq(plantTrials.plantId, plantId), eq(trials.status, status))
    : eq(plantTrials.plantId, plantId)
  const [total] = await db.select({ value: count() }).from(plantTrials)
    .innerJoin(trials, eq(trials.nctId, plantTrials.nctId))
    .where(where)
  const rows = await db.select({ trial: trials }).from(plantTrials)
    .innerJoin(trials, eq(trials.nctId, plantTrials.nctId))
    .where(where)
    .orderBy(sql`${trials.startDate} desc nulls last`, asc(trials.nctId))
    .offset(offset)
    .limit(limit)
  return { total: total?.value ?? 0, offset, limit, items: rows.map((row) => toTrial(row.trial)) }
}

async function publicationsByRole(db: Database, plantId: number) {
  const rows = await db.select({ publication: publications, role: plantPublications.role })
    .from(plantPublications)
    .innerJoin(publications, eq(publications.id, plantPublications.publicationId))
    .where(eq(plantPublications.plantId, plantId))
    .orderBy(asc(plantPublications.position))
  return {
    review: rows.filter((row) => row.role === 'review').map((row) => toPublication(row.publication)),
    trial: rows.filter((row) => row.role === 'trial').map((row) => toPublication(row.publication)),
  }
}

export async function listMedia(db: Database, plantId: number): Promise<MediaItem[]> {
  const rows = await db.select().from(media).where(eq(media.plantId, plantId)).orderBy(asc(media.position))
  return rows.map(toMedia)
}

/** Sources that actually contributed to this plant's document, for the attribution block. */
function usedSources(document: Omit<PlantData, 'sources'>): SourceId[] {
  const used = new Set<SourceId>()
  const taxonomy = document.taxonomy
  if (taxonomy) {
    used.add('gbif')
    if (taxonomy.ids.wfo) used.add('wfo')
    if (taxonomy.ids.col) used.add('col')
    for (const name of taxonomy.synonyms) for (const item of name.sources) used.add(item.source)
  }
  for (const name of document.commonNames) for (const item of name.sources) used.add(item.source)
  if (document.compounds.total) {
    used.add('wikidata')
    if (document.compounds.items.some((item) => item.pubchemCid)) used.add('pubchem')
  }
  if (document.literature) {
    used.add('pubmed')
    if ([...document.literature.recentReviews, ...document.literature.recentTrials].some((item) => item.sources.includes('europepmc'))) used.add('europepmc')
  }
  if (document.trials?.total) used.add('ctgov')
  if (document.distribution) {
    used.add('gbif')
    if (document.distribution.inaturalistObservations !== null) used.add('inaturalist')
  }
  for (const item of document.media) used.add(item.source)
  if (document.summary) used.add('wikipedia')
  return [...used]
}

export async function readPlant(db: Database, plant: PlantRow): Promise<PlantData> {
  const rows = await areaRows(db, plant.id)
  const data = <T>(area: DataArea | 'summary'): T | null => (rows.get(area)?.data as T | undefined) ?? null

  const literatureCounts = data<Omit<Literature, 'recentReviews' | 'recentTrials'>>('literature')
  const trialCounts = data<Omit<TrialSummary, 'items'>>('trials')
  const [compoundPage, lists, trialPage, mediaItems] = await Promise.all([
    listCompounds(db, plant.id, 0, COMPOUNDS_PREVIEW),
    literatureCounts ? publicationsByRole(db, plant.id) : Promise.resolve({ review: [], trial: [] }),
    trialCounts ? listTrials(db, plant.id, 0, TRIALS_PREVIEW) : Promise.resolve(null),
    listMedia(db, plant.id),
  ])

  const freshness: AreaFreshness[] = AREAS.map((area) => {
    const row = rows.get(area)
    return { area, fetchedAt: row?.data !== null && row ? row.fetchedAt.toISOString() : null, ok: row?.ok ?? false }
  })

  const document: Omit<PlantData, 'sources'> = {
    slug: plant.slug,
    scientificName: plant.scientificName,
    resolved: plant.resolveStatus === 'resolved',
    taxonomy: data<Taxonomy>('taxonomy'),
    commonNames: data<CommonName[]>('names') ?? [],
    compounds: { total: compoundPage.total, items: compoundPage.items },
    literature: literatureCounts ? { ...literatureCounts, recentReviews: lists.review, recentTrials: lists.trial } : null,
    trials: trialCounts && trialPage ? { ...trialCounts, items: trialPage.items } : null,
    distribution: data<Distribution>('distribution'),
    media: mediaItems,
    summary: data<Summary>('summary'),
    freshness,
  }
  return { ...document, sources: usedSources(document).map((id) => SOURCES[id]) }
}

export async function listPlants(db: Database): Promise<PlantListItem[]> {
  const rows = await db.select().from(plants).where(eq(plants.active, true)).orderBy(asc(plants.slug))
  const areas = await db.select({ plantId: plantAreas.plantId, area: plantAreas.area, fetchedAt: plantAreas.fetchedAt, hasData: sql<boolean>`${plantAreas.data} is not null` })
    .from(plantAreas)
  return rows.map((plant) => {
    const own = areas.filter((row) => row.plantId === plant.id)
    const coverage = Object.fromEntries(AREAS.map((area) => [area, own.some((row) => row.area === area && row.hasData)])) as Record<DataArea, boolean>
    const latest = own.reduce<Date | null>((acc, row) => (!acc || row.fetchedAt > acc ? row.fetchedAt : acc), null)
    return { slug: plant.slug, scientificName: plant.scientificName, resolved: plant.resolveStatus === 'resolved', coverage, updatedAt: latest?.toISOString() ?? null }
  })
}
