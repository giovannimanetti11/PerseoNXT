import type { SyncResult } from '#shared/types/api'

/**
 * Rebuilds the records of one content type from WordPress: every published
 * entry is upserted, records whose slug no longer exists are removed.
 * Records are built on the server, the browser only sends type and password.
 */
export default defineEventHandler(async (event): Promise<SyncResult> => {
  const body = await readBody<{ password?: unknown; type?: unknown; removeOrphans?: unknown }>(event)
  const type = parseContentType(body?.type)
  await requireAdmin(event, body?.password, `algolia-sync:${type}`)

  try {
    const [records, indexed] = await Promise.all([wordpressRecords(event, type), indexedObjectIds(event, type)])
    const wpIds = new Set(records.map((record) => record.objectID))
    const orphans = body?.removeOrphans === true ? indexed.filter((id) => !wpIds.has(id)) : []
    await writeRecords(event, records, orphans)
    return { type, updated: records.length, deleted: orphans.length }
  } catch (error) {
    throw toHttpError(error)
  }
})
