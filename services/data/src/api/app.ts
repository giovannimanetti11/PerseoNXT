import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import { timingSafeEqual } from 'node:crypto'
import { desc, sql } from 'drizzle-orm'
import type { Config } from '../config.js'
import type { Database } from '../db/index.js'
import { sourceErrors } from '../db/schema.js'
import { collectWithLock, createHttp } from '../pipeline/runner.js'
import { SOURCES } from '../sources/catalog.js'
import { findActivePlant, listCompounds, listMedia, listPlants, listTrials, readPlant } from './read.js'

const slugParams = {
  type: 'object',
  required: ['slug'],
  properties: { slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 120 } },
} as const

const pageQuery = {
  type: 'object',
  properties: {
    offset: { type: 'integer', minimum: 0, maximum: 100_000, default: 0 },
    limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
    q: { type: 'string', maxLength: 80 },
  },
} as const

interface SlugRequest { Params: { slug: string } }
interface PageRequest extends SlugRequest { Querystring: { offset: number; limit: number; q?: string } }
interface TrialsRequest extends SlugRequest { Querystring: { offset: number; limit: number; status?: string } }

const trialsQuery = {
  type: 'object',
  properties: {
    offset: pageQuery.properties.offset,
    limit: pageQuery.properties.limit,
    status: { type: 'string', pattern: '^[A-Z_]{2,40}$' },
  },
} as const

function tokenMatches(header: string | undefined, token: string): boolean {
  if (!token || !header?.startsWith('Bearer ')) return false
  const given = Buffer.from(header.slice(7))
  const expected = Buffer.from(token)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function buildApp(db: Database, config: Config): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' }, trustProxy: false })
  const http = createHttp(config)
  const refreshing = new Set<string>()

  await app.register(swagger, {
    openapi: {
      info: { title: 'Wikiherbalist data', version: '0.1.0', description: 'Dati aperti sulle piante medicinali, aggregati e normalizzati.' },
    },
  })
  await app.register(rateLimit, { global: false })

  async function plantOr404(request: FastifyRequest<SlugRequest>, reply: FastifyReply) {
    const plant = await findActivePlant(db, request.params.slug)
    if (!plant) reply.code(404).send({ error: 'Pianta non trovata' })
    return plant
  }

  app.get('/v1/health', async () => {
    await db.execute(sql`select 1`)
    return { status: 'ok' }
  })

  app.get('/v1/openapi.json', async () => app.swagger())

  app.get('/v1/sources', async () => {
    const errors = await db.select({ source: sourceErrors.source, count: sql<number>`count(*)::int`, last: sql<Date>`max(${sourceErrors.occurredAt})` })
      .from(sourceErrors)
      .where(sql`${sourceErrors.occurredAt} > now() - interval '7 days'`)
      .groupBy(sourceErrors.source)
    return Object.values(SOURCES).map((source) => {
      const failures = errors.find((row) => row.source === source.id)
      return { ...source, errorsLast7Days: failures?.count ?? 0, lastError: failures?.last ?? null }
    })
  })

  app.get('/v1/plants', async () => listPlants(db))

  app.get<SlugRequest>('/v1/plants/:slug', { schema: { params: slugParams } }, async (request, reply) => {
    const plant = await plantOr404(request, reply)
    if (!plant) return reply
    reply.header('Cache-Control', 'public, max-age=300')
    return readPlant(db, plant)
  })

  app.get<PageRequest>('/v1/plants/:slug/compounds', { schema: { params: slugParams, querystring: pageQuery } }, async (request, reply) => {
    const plant = await plantOr404(request, reply)
    if (!plant) return reply
    return listCompounds(db, plant.id, request.query.offset, request.query.limit, request.query.q?.trim() ?? '')
  })

  app.get<TrialsRequest>('/v1/plants/:slug/trials', { schema: { params: slugParams, querystring: trialsQuery } }, async (request, reply) => {
    const plant = await plantOr404(request, reply)
    if (!plant) return reply
    return listTrials(db, plant.id, request.query.offset, request.query.limit, request.query.status ?? '')
  })

  app.get<SlugRequest>('/v1/plants/:slug/media', { schema: { params: slugParams } }, async (request, reply) => {
    const plant = await plantOr404(request, reply)
    if (!plant) return reply
    return listMedia(db, plant.id)
  })

  app.get('/v1/errors', async () =>
    db.select().from(sourceErrors).orderBy(desc(sourceErrors.occurredAt)).limit(100))

  // Collection takes up to a minute: the request returns at once and the run continues in the background.
  app.post<SlugRequest>('/v1/admin/refresh/:slug', {
    schema: { params: slugParams },
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    if (!tokenMatches(request.headers.authorization, config.adminToken)) return reply.code(401).send({ error: 'Token non valido' })
    const { slug } = request.params
    if (!(await findActivePlant(db, slug))) return reply.code(404).send({ error: 'Pianta non trovata' })
    if (refreshing.has(slug)) return reply.code(409).send({ error: 'Aggiornamento già in corso' })
    refreshing.add(slug)
    collectWithLock(db, http, config, slug)
      .then((outcome) => app.log.info({ slug, outcome }, 'refresh completed'))
      .catch((error: unknown) => app.log.error({ slug, error }, 'refresh failed'))
      .finally(() => refreshing.delete(slug))
    return reply.code(202).send({ status: 'started', slug })
  })

  return app
}
