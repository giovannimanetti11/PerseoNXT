import { eq, sql } from 'drizzle-orm'
import type { Database } from '../db/index.js'
import { compounds, media, plantAreas, plantCompounds, plantPublications, plants, plantTrials, publications, trials } from '../db/schema.js'
import type { ClinicalTrial, Compound, DataArea, ExternalIds, MediaItem, Publication } from '../types.js'

type Area = DataArea | 'summary'
const CHUNK = 200

function chunks<T>(items: T[], size = CHUNK): T[][] {
  const result: T[][] = []
  for (let start = 0; start < items.length; start += size) result.push(items.slice(start, start + size))
  return result
}

const excluded = (column: string) => sql.raw(`excluded.${column}`)

export async function saveArea(db: Database, plantId: number, area: Area, data: unknown): Promise<void> {
  const now = new Date()
  await db.insert(plantAreas).values({ plantId, area, data, ok: true, error: null, fetchedAt: now })
    .onConflictDoUpdate({ target: [plantAreas.plantId, plantAreas.area], set: { data, ok: true, error: null, fetchedAt: now } })
}

/** Marks the area as failed and keeps the last good data. */
export async function failArea(db: Database, plantId: number, area: Area, error: string): Promise<void> {
  await db.insert(plantAreas).values({ plantId, area, data: null, ok: false, error })
    .onConflictDoUpdate({ target: [plantAreas.plantId, plantAreas.area], set: { ok: false, error } })
}

export async function saveResolution(
  db: Database,
  plantId: number,
  values: { status: 'resolved' | 'unresolved'; note: string | null; acceptedName: string | null; family: string | null; ids: ExternalIds },
): Promise<void> {
  await db.update(plants).set({
    resolveStatus: values.status,
    resolveNote: values.note,
    acceptedName: values.acceptedName,
    family: values.family,
    ids: values.ids,
    resolvedAt: new Date(),
  }).where(eq(plants.id, plantId))
}

const compoundKey = (compound: Compound) =>
  compound.inchikey || (compound.pubchemCid ? `cid:${compound.pubchemCid}` : `wd:${compound.wikidataId}`)

export async function replaceCompounds(db: Database, plantId: number, items: Compound[]): Promise<void> {
  await db.transaction(async (tx) => {
    const ids = new Map<string, number>()
    for (const batch of chunks(items)) {
      const rows = await tx.insert(compounds).values(batch.map((compound) => ({
        key: compoundKey(compound),
        inchikey: compound.inchikey || null,
        pubchemCid: compound.pubchemCid,
        wikidataId: compound.wikidataId,
        name: compound.name,
        formula: compound.formula,
        molecularWeight: compound.molecularWeight,
        iupacName: compound.iupacName,
      }))).onConflictDoUpdate({
        target: compounds.key,
        set: {
          inchikey: excluded('inchikey'),
          pubchemCid: sql`coalesce(excluded.pubchem_cid, ${compounds.pubchemCid})`,
          wikidataId: sql`coalesce(excluded.wikidata_id, ${compounds.wikidataId})`,
          name: excluded('name'),
          formula: excluded('formula'),
          molecularWeight: excluded('molecular_weight'),
          iupacName: excluded('iupac_name'),
          updatedAt: new Date(),
        },
      }).returning({ id: compounds.id, key: compounds.key })
      for (const row of rows) ids.set(row.key, row.id)
    }
    await tx.delete(plantCompounds).where(eq(plantCompounds.plantId, plantId))
    for (const batch of chunks(items)) {
      await tx.insert(plantCompounds).values(batch.flatMap((compound) => {
        const compoundId = ids.get(compoundKey(compound))
        return compoundId ? [{ plantId, compoundId, references: compound.references }] : []
      })).onConflictDoNothing()
    }
  })
}

export async function replacePublications(db: Database, plantId: number, lists: { review: Publication[]; trial: Publication[] }): Promise<void> {
  await db.transaction(async (tx) => {
    const all = [...new Map([...lists.review, ...lists.trial].filter((item) => item.pmid).map((item) => [item.pmid, item])).values()]
    const ids = new Map<string, number>()
    for (const batch of chunks(all)) {
      const rows = await tx.insert(publications).values(batch.map((item) => ({
        pmid: item.pmid,
        doi: item.doi,
        pmcid: item.pmcid,
        title: item.title,
        journal: item.journal,
        year: item.year,
        types: item.types,
        openAccess: item.openAccess,
        citations: item.citations,
        url: item.url,
        sources: item.sources,
      }))).onConflictDoUpdate({
        target: publications.pmid,
        set: {
          doi: excluded('doi'),
          pmcid: excluded('pmcid'),
          title: excluded('title'),
          journal: excluded('journal'),
          year: excluded('year'),
          types: excluded('types'),
          // Europe PMC may be down on this run: keep what an earlier run found.
          openAccess: sql`coalesce(excluded.open_access, ${publications.openAccess})`,
          citations: sql`coalesce(excluded.citations, ${publications.citations})`,
          url: excluded('url'),
          sources: excluded('sources'),
          updatedAt: new Date(),
        },
      }).returning({ id: publications.id, pmid: publications.pmid })
      for (const row of rows) if (row.pmid) ids.set(row.pmid, row.id)
    }
    await tx.delete(plantPublications).where(eq(plantPublications.plantId, plantId))
    const links = (['review', 'trial'] as const).flatMap((role) =>
      lists[role].flatMap((item, position) => {
        const publicationId = item.pmid ? ids.get(item.pmid) : undefined
        return publicationId ? [{ plantId, publicationId, role, position }] : []
      }))
    if (links.length) await tx.insert(plantPublications).values(links).onConflictDoNothing()
  })
}

export async function replaceTrials(db: Database, plantId: number, items: ClinicalTrial[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (const batch of chunks(items)) {
      await tx.insert(trials).values(batch).onConflictDoUpdate({
        target: trials.nctId,
        set: {
          title: excluded('title'),
          status: excluded('status'),
          phases: excluded('phases'),
          studyType: excluded('study_type'),
          conditions: excluded('conditions'),
          enrollment: excluded('enrollment'),
          startDate: excluded('start_date'),
          completionDate: excluded('completion_date'),
          summary: excluded('summary'),
          interventions: excluded('interventions'),
          sponsor: excluded('sponsor'),
          countries: excluded('countries'),
          hasResults: excluded('has_results'),
          url: excluded('url'),
          updatedAt: new Date(),
        },
      })
    }
    await tx.delete(plantTrials).where(eq(plantTrials.plantId, plantId))
    for (const batch of chunks(items)) {
      await tx.insert(plantTrials).values(batch.map((trial) => ({ plantId, nctId: trial.nctId }))).onConflictDoNothing()
    }
  })
}

export async function replaceMedia(db: Database, plantId: number, items: MediaItem[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(media).where(eq(media.plantId, plantId))
    if (items.length) await tx.insert(media).values(items.map((item, position) => ({ plantId, ...item, position }))).onConflictDoNothing()
  })
}
