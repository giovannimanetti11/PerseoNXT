import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { fileURLToPath } from 'node:url'
import * as schema from './schema.js'

export type Database = ReturnType<typeof createDatabase>['db']

export function createDatabase(url: string) {
  const client = postgres(url, { max: 5, onnotice: () => {} })
  const db = drizzle(client, { schema })
  return { db, close: () => client.end({ timeout: 5 }) }
}

/** Migrations ship next to the build: dist/db -> ../../drizzle. */
export async function runMigrations(db: Database): Promise<void> {
  const folder = fileURLToPath(new URL('../../drizzle', import.meta.url))
  await migrate(db, { migrationsFolder: folder })
}

export { schema }
