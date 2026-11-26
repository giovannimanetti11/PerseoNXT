import { and, eq, sql } from 'drizzle-orm'
import type { Config } from '../config.js'
import type { Database } from '../db/index.js'
import { plants } from '../db/schema.js'
import { HOST_POLICIES, HttpClient } from '../http/client.js'
import { collectPlant, type PlantOutcome } from './collect.js'
import { fetchWordPressPlants, syncPlants } from './plants.js'
import { databaseRecorder } from './recorder.js'

export function createHttp(config: Config): HttpClient {
  return new HttpClient(config.userAgent, {
    ...HOST_POLICIES,
    'www.wikidata.org': { minIntervalMs: 250 },
  })
}

/**
 * Runs one plant under a Postgres advisory lock, so the weekly timer and an
 * admin refresh never collect the same plant at the same time.
 */
export async function collectWithLock(db: Database, http: HttpClient, config: Config, slug: string): Promise<PlantOutcome | 'busy' | 'missing'> {
  const [plant] = await db.select().from(plants).where(and(eq(plants.slug, slug), eq(plants.active, true))).limit(1)
  if (!plant) return 'missing'
  // Transaction-scoped lock: released at commit on the same connection, which a
  // session lock taken from a pool cannot guarantee.
  return db.transaction(async (tx) => {
    const [lock] = await tx.execute<{ locked: boolean }>(
      sql`select pg_try_advisory_xact_lock(hashtext(${`wikiherbalist-data:${slug}`})) as locked`,
    )
    if (!lock?.locked) return 'busy' as const
    return collectPlant(db, http, databaseRecorder(db), plant, config.ncbiApiKey)
  })
}

export async function collectAll(db: Database, config: Config, log: (line: string) => void, only?: string[]): Promise<PlantOutcome[]> {
  const http = createHttp(config)
  const synced = await syncPlants(db, await fetchWordPressPlants(http, config.wpGraphqlUrl))
  log(`WordPress: ${synced.added} nuove piante, ${synced.deactivated} disattivate`)
  const rows = await db.select({ slug: plants.slug }).from(plants).where(eq(plants.active, true)).orderBy(plants.slug)
  const slugs = only?.length ? rows.map((row) => row.slug).filter((slug) => only.includes(slug)) : rows.map((row) => row.slug)

  const outcomes: PlantOutcome[] = []
  for (const [index, slug] of slugs.entries()) {
    const started = Date.now()
    const outcome = await collectWithLock(db, http, config, slug)
    if (outcome === 'busy' || outcome === 'missing') {
      log(`[${index + 1}/${slugs.length}] ${slug}: ${outcome === 'busy' ? 'raccolta già in corso, saltata' : 'non trovata'}`)
      continue
    }
    outcomes.push(outcome)
    const seconds = Math.round((Date.now() - started) / 1000)
    log(`[${index + 1}/${slugs.length}] ${slug} (${seconds}s): ${outcome.areas.map((area) => `${area.ok ? '' : '!'}${area.area}=${area.detail}`).join(' | ')}`)
  }
  return outcomes
}
