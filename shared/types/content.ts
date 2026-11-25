import type { WpSeo, WpTag } from './wordpress'

export type ContentType = 'plant' | 'glossary' | 'blog'

export interface ContentSubsection {
  heading: string
  html: string
}

export interface ContentSection {
  heading: string
  /** CSS hook, e.g. "post-section-botanica" */
  className: string
  html: string
  subsections: ContentSubsection[]
}

export interface StructuredContent {
  /** HTML that precedes the first <h3> */
  intro: string
  sections: ContentSection[]
}

export interface ContentImage {
  sourceUrl: string
  altText: string
}

interface ContentPageBase {
  title: string
  slug: string
  date: string
  modified: string
  authorName: string
  seo: WpSeo | null
  featuredImage: ContentImage | null
  readingTime: number
  content: StructuredContent
}

export interface DrugInteractions {
  text: string
  source: string
  emaMonografiaUrl: string
  emaPageUrl: string
  drugscomUrl: string
}

export interface PlantPage extends ContentPageBase {
  type: 'plant'
  nomeScientifico: string
  nomeComune: string[]
  partiUsate: string[]
  costituenti: string
  interazioni: DrugInteractions | null
  revisionDates: string[]
  additionalImages: ContentImage[]
  tags: WpTag[]
}

export interface GlossaryPage extends ContentPageBase {
  type: 'glossary'
}

export interface BlogPage extends ContentPageBase {
  type: 'blog'
  excerpt: string
}

export interface TaxonomyInfo {
  basionym: string
  synonyms: string[]
  classification: { rank: string; name: string; link: string }[]
}

export interface SearchRecord {
  objectID: string
  title: string
  contentType: ContentType
  nomeScientifico?: string
  authorName?: string
  imageUrl?: string
  imageAlt?: string
}

/** One Server-Sent Event of /api/gbif-observations. */
export interface ObservationMessage {
  year: number
  points: { lat: number; lon: number }[]
  done: boolean
  error?: string
}
