import type { SyncStatus } from '#shared/types/api'

/** Compares WordPress with the Algolia index for one content type. */
export default defineEventHandler(async (event): Promise<SyncStatus> => {
  const body = await readBody<{ password?: unknown; type?: unknown }>(event)
  const type = parseContentType(body?.type)
  await requireAdmin(event, body?.password, `algolia-status:${type}`)

  try {
    const [records, indexed] = await Promise.all([wordpressRecords(event, type), indexedObjectIds(event, type)])
    const wpIds = new Set(records.map((record) => record.objectID))
    const indexedIds = new Set(indexed)
    return {
      type,
      wordpress: wpIds.size,
      algolia: indexedIds.size,
      missing: [...wpIds].filter((id) => !indexedIds.has(id)),
      orphaned: [...indexedIds].filter((id) => !wpIds.has(id)),
    }
  } catch (error) {
    throw toHttpError(error)
  }
})
