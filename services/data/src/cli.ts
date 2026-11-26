/**
 * node dist/cli.js migrate
 * node dist/cli.js collect [slug ...]
 * node dist/cli.js trials [slug ...]   (ClinicalTrials.gov only)
 * node dist/cli.js report
 */
import { loadConfig } from './config.js'
import { createDatabase, runMigrations } from './db/index.js'
import { listPlants } from './api/read.js'
import { eq } from 'drizzle-orm'
import { plants } from './db/schema.js'
import { collectTrials } from './pipeline/collect.js'
import { databaseRecorder } from './pipeline/recorder.js'
import { collectAll, createHttp } from './pipeline/runner.js'

const [command, ...args] = process.argv.slice(2)
const config = loadConfig()
const { db, close } = createDatabase(config.databaseUrl)
const log = (line: string) => console.log(`${new Date().toISOString()} ${line}`)

try {
  if (command === 'migrate') {
    await runMigrations(db)
    log('migrazioni applicate')
  } else if (command === 'collect') {
    const outcomes = await collectAll(db, config, log, args)
    const failed = outcomes.flatMap((outcome) => outcome.areas.filter((area) => !area.ok).map((area) => `${outcome.slug}/${area.area}`))
    log(`fine: ${outcomes.length} piante, ${outcomes.filter((outcome) => !outcome.resolved).length} non risolte, ${failed.length} aree fallite`)
    if (failed.length) log(`aree fallite: ${failed.join(', ')}`)
  } else if (command === 'trials') {
    const http = createHttp(config)
    const rows = await db.select().from(plants).where(eq(plants.active, true)).orderBy(plants.slug)
    const selected = args.length ? rows.filter((row) => args.includes(row.slug)) : rows
    for (const [index, plant] of selected.entries()) {
      try {
        log(`[${index + 1}/${selected.length}] ${plant.slug}: ${await collectTrials(db, http, databaseRecorder(db), plant)}`)
      } catch (error) {
        log(`[${index + 1}/${selected.length}] ${plant.slug}: errore ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  } else if (command === 'report') {
    const plants = await listPlants(db)
    const areas = ['taxonomy', 'compounds', 'literature', 'trials', 'distribution', 'names', 'media'] as const
    console.log(`piante attive: ${plants.length}, risolte: ${plants.filter((plant) => plant.resolved).length}`)
    for (const area of areas) console.log(`${area.padEnd(13)} ${plants.filter((plant) => plant.coverage[area]).length}/${plants.length}`)
    const unresolved = plants.filter((plant) => !plant.resolved)
    if (unresolved.length) console.log(`non risolte: ${unresolved.map((plant) => `${plant.slug} (${plant.scientificName})`).join(', ')}`)
  } else {
    console.error('Uso: cli.js migrate | collect [slug ...] | trials [slug ...] | report')
    process.exitCode = 2
  }
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  await close()
}
