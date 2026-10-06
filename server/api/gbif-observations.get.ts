import { defineEventHandler, getQuery, createError } from 'h3'
import Redis from 'ioredis'

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
})

// Redis is an optional cache for this endpoint: keep connection errors handled
// so a temporary cache outage does not emit unhandled error events.
redis.on('error', () => {})

const CACHE_TTL = 60 * 60 * 24
const YEAR = '2025'
const MAX_BATCHES = 11
const BATCH_SIZE = 300

interface GbifPoint { lat: number; lon: number }

async function fetchTaxonKey(name: string): Promise<number | null> {
  const res = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': 'Wikiherbalist/1.0 (wikiherbalist.com)' }
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.usageKey ?? null
}

async function fetchBatch(taxonKey: number, offset: number): Promise<{ points: GbifPoint[]; total: number; endOfRecords: boolean }> {
  const params = new URLSearchParams({
    taxon_key: String(taxonKey),
    year: YEAR,
    hasCoordinate: 'true',
    basisOfRecord: 'HUMAN_OBSERVATION',
    offset: String(offset),
    limit: String(BATCH_SIZE),
  })
  const res = await fetch(`https://api.gbif.org/v1/occurrence/search?${params}`, {
    headers: { 'User-Agent': 'Wikiherbalist/1.0 (wikiherbalist.com)' }
  })
  if (!res.ok) return { points: [], total: 0, endOfRecords: true }
  const data = await res.json()
  const points: GbifPoint[] = (data.results ?? [])
    .filter((r: any) => r.decimalLongitude != null && r.decimalLatitude != null)
    .map((r: any) => ({ lon: r.decimalLongitude, lat: r.decimalLatitude }))
  return { points, total: data.count ?? 0, endOfRecords: data.endOfRecords ?? true }
}

export default defineEventHandler(async (event) => {
  const { name, stream } = getQuery(event) as { name?: string; stream?: string }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Missing name parameter' })
  }

  const cacheKey = `gbif:obs:${name.trim().toLowerCase()}:${YEAR}`

  // --- SSE streaming mode ---
  if (stream === '1') {
    event.node.res.setHeader('Content-Type', 'text/event-stream')
    event.node.res.setHeader('Cache-Control', 'no-cache')
    event.node.res.setHeader('Connection', 'keep-alive')
    event.node.res.setHeader('X-Accel-Buffering', 'no')

    const send = (data: object) => {
      event.node.res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    return new Promise<void>(async (resolve) => {
      try {
        // Cache hit: single event with all data
        try {
          await redis.connect().catch(() => {})
          const cached = await redis.get(cacheKey)
          if (cached) {
            const parsed = JSON.parse(cached)
            send({ points: parsed.points, done: true })
            event.node.res.end()
            return resolve()
          }
        } catch { /* Redis non disponibile */ }

        const taxonKey = await fetchTaxonKey(name.trim())
        if (!taxonKey) {
          send({ error: `Taxon not found: ${name}` })
          event.node.res.end()
          return resolve()
        }

        // Primo batch: ottieni total e prima tranche di punti
        const { points: firstPoints, total, endOfRecords: firstEnd } = await fetchBatch(taxonKey, 0)
        const allPoints: GbifPoint[] = [...firstPoints]
        send({ points: firstPoints, done: false })

        if (!firstEnd && total > BATCH_SIZE) {
          // Calcola batch rimanenti e lancia tutto in parallelo
          const remainingCount = Math.min(Math.ceil(total / BATCH_SIZE) - 1, MAX_BATCHES - 1)
          const batchPromises = Array.from({ length: remainingCount }, (_, i) =>
            fetchBatch(taxonKey, (i + 1) * BATCH_SIZE)
          )

          // Streamma ogni batch appena completato
          await Promise.all(
            batchPromises.map(async (p) => {
              const { points } = await p
              if (points.length) {
                allPoints.push(...points)
                send({ points, done: false })
              }
            })
          )
        }

        send({ points: [], done: true })
        event.node.res.end()

        // Salva in cache Redis
        try {
          await redis.set(cacheKey, JSON.stringify({ points: allPoints, total }), 'EX', CACHE_TTL)
        } catch { /* ignora */ }

        resolve()
      } catch (err) {
        send({ error: String(err) })
        event.node.res.end()
        resolve()
      }
    })
  }

  // --- JSON mode (usato internamente se cache hit) ---
  try {
    await redis.connect().catch(() => {})
    const cached = await redis.get(cacheKey)
    if (cached) {
      event.node.res.setHeader('X-Cache', 'HIT')
      return JSON.parse(cached)
    }
  } catch { /* Redis non disponibile */ }

  const taxonKey = await fetchTaxonKey(name.trim())
  if (!taxonKey) throw createError({ statusCode: 404, message: `Taxon not found for: ${name}` })

  const { points: firstPoints, total, endOfRecords: firstEnd } = await fetchBatch(taxonKey, 0)
  const allPoints: GbifPoint[] = [...firstPoints]

  if (!firstEnd && total > BATCH_SIZE) {
    const remainingCount = Math.min(Math.ceil(total / BATCH_SIZE) - 1, MAX_BATCHES - 1)
    const results = await Promise.all(
      Array.from({ length: remainingCount }, (_, i) => fetchBatch(taxonKey, (i + 1) * BATCH_SIZE))
    )
    for (const { points } of results) allPoints.push(...points)
  }

  const result = { points: allPoints, total }
  try {
    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL)
    event.node.res.setHeader('X-Cache', 'MISS')
  } catch { /* ignora */ }

  return result
})
