import type { Database } from '../db/index.js'
import { rawPayloads, sourceErrors } from '../db/schema.js'
import type { Recorder } from '../sources/context.js'

/** Keeps the latest payload per (source, plant, request) and appends every failure. */
export function databaseRecorder(db: Database): Recorder {
  return {
    async payload(entry) {
      const values = {
        source: entry.source,
        plantSlug: entry.plantSlug,
        requestKey: entry.requestKey,
        url: entry.url,
        status: entry.status,
        durationMs: entry.durationMs,
        body: entry.body,
        fetchedAt: new Date(),
      }
      await db.insert(rawPayloads).values(values).onConflictDoUpdate({
        target: [rawPayloads.source, rawPayloads.plantSlug, rawPayloads.requestKey],
        set: { url: values.url, status: values.status, durationMs: values.durationMs, body: values.body, fetchedAt: values.fetchedAt },
      })
    },
    async failure(entry) {
      await db.insert(sourceErrors).values({ ...entry, message: entry.message.slice(0, 500) })
    },
  }
}
