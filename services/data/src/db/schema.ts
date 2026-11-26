import { sql } from 'drizzle-orm'
import {
  boolean, index, integer, jsonb, pgTable, primaryKey, real, serial, smallint, text, timestamp, uniqueIndex,
} from 'drizzle-orm/pg-core'
import type { DataArea, ExternalIds, SourceId, StudyType, TrialIntervention } from '../types.js'

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

/** One row per published plant on WordPress. */
export const plants = pgTable('plants', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  wpTitle: text('wp_title').notNull(),
  scientificName: text('scientific_name').notNull(),
  acceptedName: text('accepted_name'),
  family: text('family'),
  ids: jsonb('ids').$type<ExternalIds>().notNull().default({}),
  /** resolved | unresolved | ambiguous */
  resolveStatus: text('resolve_status').notNull().default('pending'),
  resolveNote: text('resolve_note'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
})

/** Every response received from a source, to audit and re-normalize without refetching. */
export const rawPayloads = pgTable('raw_payloads', {
  id: serial('id').primaryKey(),
  source: text('source').$type<SourceId>().notNull(),
  plantSlug: text('plant_slug').notNull(),
  requestKey: text('request_key').notNull(),
  url: text('url').notNull(),
  status: smallint('status').notNull(),
  durationMs: integer('duration_ms').notNull(),
  body: jsonb('body').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('raw_payloads_key').on(table.source, table.plantSlug, table.requestKey),
])

export const sourceErrors = pgTable('source_errors', {
  id: serial('id').primaryKey(),
  source: text('source').$type<SourceId>().notNull(),
  plantSlug: text('plant_slug').notNull(),
  requestKey: text('request_key').notNull(),
  url: text('url').notNull(),
  status: smallint('status').notNull(),
  message: text('message').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('source_errors_time').on(table.occurredAt)])

/**
 * Latest result of each data area for a plant: the aggregated document served
 * by the API (taxonomy, common names, counts, distributions). Compounds,
 * publications, trials and media live in their own tables, shared across plants.
 * On a failed run `ok` and `error` change, `data` and `fetched_at` keep the last good result.
 */
export const plantAreas = pgTable('plant_areas', {
  plantId: integer('plant_id').notNull().references(() => plants.id, { onDelete: 'cascade' }),
  area: text('area').$type<DataArea | 'summary'>().notNull(),
  data: jsonb('data'),
  ok: boolean('ok').notNull(),
  error: text('error'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.plantId, table.area] })])

export const compounds = pgTable('compounds', {
  id: serial('id').primaryKey(),
  /** InChIKey, or "cid:N" / "wd:Q..." when the structure key is unknown. */
  key: text('key').notNull().unique(),
  inchikey: text('inchikey'),
  pubchemCid: integer('pubchem_cid'),
  wikidataId: text('wikidata_id'),
  name: text('name').notNull(),
  formula: text('formula').notNull().default(''),
  molecularWeight: real('molecular_weight'),
  iupacName: text('iupac_name').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const plantCompounds = pgTable('plant_compounds', {
  plantId: integer('plant_id').notNull().references(() => plants.id, { onDelete: 'cascade' }),
  compoundId: integer('compound_id').notNull().references(() => compounds.id, { onDelete: 'cascade' }),
  references: text('references').array().notNull().default(sql`'{}'::text[]`),
}, (table) => [primaryKey({ columns: [table.plantId, table.compoundId] })])

export const publications = pgTable('publications', {
  id: serial('id').primaryKey(),
  pmid: text('pmid').unique(),
  doi: text('doi'),
  pmcid: text('pmcid'),
  title: text('title').notNull(),
  journal: text('journal').notNull().default(''),
  year: smallint('year'),
  types: text('types').array().$type<StudyType[]>().notNull(),
  openAccess: boolean('open_access'),
  citations: integer('citations'),
  url: text('url').notNull(),
  sources: text('sources').array().$type<SourceId[]>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('publications_doi').on(table.doi)])

export const plantPublications = pgTable('plant_publications', {
  plantId: integer('plant_id').notNull().references(() => plants.id, { onDelete: 'cascade' }),
  publicationId: integer('publication_id').notNull().references(() => publications.id, { onDelete: 'cascade' }),
  /** review | trial: the list the record was found in. */
  role: text('role').notNull(),
  position: smallint('position').notNull(),
}, (table) => [primaryKey({ columns: [table.plantId, table.publicationId, table.role] })])

export const trials = pgTable('trials', {
  nctId: text('nct_id').primaryKey(),
  title: text('title').notNull(),
  status: text('status').notNull(),
  phases: text('phases').array().notNull(),
  studyType: text('study_type').notNull(),
  conditions: text('conditions').array().notNull(),
  enrollment: integer('enrollment'),
  startDate: text('start_date'),
  completionDate: text('completion_date'),
  summary: text('summary'),
  interventions: jsonb('interventions').$type<TrialIntervention[]>().notNull().default([]),
  sponsor: text('sponsor'),
  countries: text('countries').array().notNull().default(sql`'{}'::text[]`),
  hasResults: boolean('has_results').notNull().default(false),
  url: text('url').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const plantTrials = pgTable('plant_trials', {
  plantId: integer('plant_id').notNull().references(() => plants.id, { onDelete: 'cascade' }),
  nctId: text('nct_id').notNull().references(() => trials.nctId, { onDelete: 'cascade' }),
}, (table) => [primaryKey({ columns: [table.plantId, table.nctId] })])

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  plantId: integer('plant_id').notNull().references(() => plants.id, { onDelete: 'cascade' }),
  source: text('source').$type<'commons' | 'inaturalist'>().notNull(),
  sourceId: text('source_id').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  pageUrl: text('page_url').notNull(),
  license: text('license').notNull(),
  author: text('author').notNull(),
  credit: text('credit').notNull(),
  position: smallint('position').notNull(),
}, (table) => [uniqueIndex('media_source_item').on(table.plantId, table.source, table.sourceId)])
