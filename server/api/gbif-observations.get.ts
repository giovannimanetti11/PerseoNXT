import type { ObservationMessage } from '#shared/types/content'

interface GbifPoint {
  lat: number
  lon: number
}

interface GbifOccurrencePage {
  count?: number
  endOfRecords?: boolean
  results?: { decimalLatitude?: number | null; decimalLongitude?: number | null }[]
}

interface ObservationBatch {
  points: GbifPoint[]
  total: number
  endOfRecords: boolean
}

const CACHE_TTL_SECONDS = 60 * 60 * 24
const BATCH_SIZE = 300
const MAX_BATCHES = 11
const headers = { 'User-Agent': 'Wikiherbalist/1.0 (wikiherbalist.com)' }

/** Last complete calendar year: the current one is still filling up. */
function observationYear(): number {
  return new Date().getFullYear() - 1
}

async function taxonKey(name: string): Promise<number | null> {
  const match = await $fetch<{ usageKey?: number }>('https://api.gbif.org/v1/species/match', {
    query: { name }, headers, timeout: 10_000,
  })
  return match.usageKey ?? null
}

async function fetchBatch(key: number, year: number, offset: number): Promise<ObservationBatch> {
  try {
    const page = await $fetch<GbifOccurrencePage>('https://api.gbif.org/v1/occurrence/search', {
      query: { taxon_key: key, year, hasCoordinate: true, basisOfRecord: 'HUMAN_OBSERVATION', offset, limit: BATCH_SIZE },
      headers,
      timeout: 20_000,
    })
    const points = (page.results ?? []).flatMap((r) =>
      typeof r.decimalLatitude === 'number' && typeof r.decimalLongitude === 'number'
        ? [{ lat: r.decimalLatitude, lon: r.decimalLongitude }]
        : [])
    return { points, total: page.count ?? 0, endOfRecords: page.endOfRecords ?? true }
  } catch {
    return { points: [], total: 0, endOfRecords: true }
  }
}

/**
 * Streams the GBIF observations of a species as Server-Sent Events, one message
 * per batch, so the map fills up while the remaining batches load.
 */
export default defineEventHandler(async (event) => {
  const name = String(getQuery(event).name ?? '').trim()
  if (!name || name.length > 200) throw createError({ statusCode: 400, statusMessage: 'Parametro name mancante' })

  const year = observationYear()
  const cacheKey = `gbif:obs:${name.toLowerCase()}:${year}`
  const stream = createEventStream(event)
  setResponseHeader(event, 'X-Accel-Buffering', 'no')
  const send = (message: ObservationMessage) => stream.push(JSON.stringify(message))

  const run = async () => {
    const cached = await cacheGet<GbifPoint[]>(cacheKey)
    if (cached) {
      await send({ year, points: cached, done: true })
      return
    }

    const key = await taxonKey(name).catch(() => null)
    if (!key) {
      await send({ year, points: [], done: true, error: 'Specie non trovata su GBIF' })
      return
    }

    const first = await fetchBatch(key, year, 0)
    const all = [...first.points]
    await send({ year, points: first.points, done: false })

    if (!first.endOfRecords && first.total > BATCH_SIZE) {
      const remaining = Math.min(Math.ceil(first.total / BATCH_SIZE) - 1, MAX_BATCHES - 1)
      await Promise.all(Array.from({ length: remaining }, async (_, i) => {
        const batch = await fetchBatch(key, year, (i + 1) * BATCH_SIZE)
        if (!batch.points.length) return
        all.push(...batch.points)
        await send({ year, points: batch.points, done: false })
      }))
    }

    await send({ year, points: [], done: true })
    await cacheSet(cacheKey, all, CACHE_TTL_SECONDS)
  }

  run()
    .catch(async (error: unknown) => {
      console.error('[gbif-observations]', error instanceof Error ? error.message : error)
      await send({ year, points: [], done: true, error: 'Osservazioni non disponibili' })
    })
    .finally(() => stream.close())

  return stream.send()
})
