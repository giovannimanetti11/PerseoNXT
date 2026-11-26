// Copy of wikiherbalist-data/src/types.ts: the response types of the plant data service.

export type SourceId =
  | 'gbif'
  | 'wfo'
  | 'col'
  | 'wikidata'
  | 'pubchem'
  | 'pubmed'
  | 'europepmc'
  | 'ctgov'
  | 'inaturalist'
  | 'wikipedia'
  | 'commons'

export type DataArea = 'taxonomy' | 'compounds' | 'literature' | 'trials' | 'distribution' | 'names' | 'media'

export interface SourceInfo {
  id: SourceId
  name: string
  homepage: string
  license: string
  licenseUrl: string
}

/** Where a value came from: the record URL on the source, for attribution and checks. */
export interface Provenance {
  source: SourceId
  url: string
}

export interface ExternalIds {
  gbif?: number
  wfo?: string
  col?: string
  wikidata?: string
  ncbi?: string
  inaturalist?: number
}

export type NameKind = 'accepted' | 'synonym' | 'basionym'

export interface ScientificName {
  /** Name without authorship, e.g. "Zingiber officinale". */
  canonical: string
  authorship: string
  kind: NameKind
  sources: Provenance[]
}

export interface ClassificationRank {
  rank: 'kingdom' | 'phylum' | 'class' | 'order' | 'family' | 'genus' | 'species'
  name: string
}

export interface Taxonomy {
  acceptedName: string
  authorship: string
  family: string
  classification: ClassificationRank[]
  basionym: ScientificName | null
  synonyms: ScientificName[]
  ids: ExternalIds
}

export interface CommonName {
  name: string
  /** ISO 639-1 code. */
  lang: string
  sources: Provenance[]
}

export interface Compound {
  inchikey: string
  pubchemCid: number | null
  wikidataId: string | null
  name: string
  formula: string
  molecularWeight: number | null
  iupacName: string
  /** DOIs of the papers reporting the compound in this plant (LOTUS via Wikidata). */
  references: string[]
}

export type StudyType = 'meta-analysis' | 'systematic-review' | 'review' | 'rct' | 'clinical-trial' | 'other'

export interface Publication {
  pmid: string | null
  doi: string | null
  pmcid: string | null
  title: string
  journal: string
  year: number | null
  types: StudyType[]
  openAccess: boolean | null
  citations: number | null
  url: string
  sources: SourceId[]
}

export interface Literature {
  /** Searched expression, to reproduce the counts on PubMed. */
  query: string
  total: number
  reviews: number
  trials: number
  byYear: { year: number; count: number }[]
  recentReviews: Publication[]
  recentTrials: Publication[]
}

export interface ClinicalTrial {
  nctId: string
  title: string
  status: string
  phases: string[]
  studyType: string
  conditions: string[]
  enrollment: number | null
  startDate: string | null
  url: string
}

export interface TrialSummary {
  total: number
  byStatus: { status: string; count: number }[]
  byPhase: { phase: string; count: number }[]
  items: ClinicalTrial[]
}

export interface Distribution {
  occurrences: number
  /** ISO 3166-1 alpha-2 country code and number of GBIF records. */
  countries: { code: string; count: number }[]
  byYear: { year: number; count: number }[]
  inaturalistObservations: number | null
}

export interface MediaItem {
  source: 'commons' | 'inaturalist'
  sourceId: string
  url: string
  thumbnailUrl: string
  pageUrl: string
  license: string
  author: string
  /** Ready-to-print credit line, e.g. "Foto: Jane Doe, CC BY 4.0, iNaturalist". */
  credit: string
}

export interface Summary {
  text: string
  url: string
  license: string
}

export interface AreaFreshness {
  area: DataArea
  fetchedAt: string | null
  ok: boolean
}

export interface PlantData {
  slug: string
  scientificName: string
  resolved: boolean
  taxonomy: Taxonomy | null
  commonNames: CommonName[]
  compounds: { total: number; items: Compound[] }
  literature: Literature | null
  trials: TrialSummary | null
  distribution: Distribution | null
  media: MediaItem[]
  summary: Summary | null
  sources: SourceInfo[]
  freshness: AreaFreshness[]
}

export interface PlantListItem {
  slug: string
  scientificName: string
  resolved: boolean
  coverage: Record<DataArea, boolean>
  updatedAt: string | null
}

export interface Page<T> {
  total: number
  offset: number
  limit: number
  items: T[]
}
