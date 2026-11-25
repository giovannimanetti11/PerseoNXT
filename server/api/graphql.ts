import type { GraphqlResponse } from '#shared/types/wordpress'
import { GraphqlSecurityError, validateGraphqlReadOnly } from '../utils/graphqlSecurity'

const MAX_GRAPHQL_BODY_BYTES = 64 * 1024
const ALLOWED_BODY_KEYS = new Set(['query', 'variables', 'operationName'])

function rethrowSecurityError(error: unknown): never {
  if (error instanceof GraphqlSecurityError) {
    throw createError({ statusCode: error.statusCode, statusMessage: error.message })
  }
  throw error
}

async function readGraphqlBody(event: Parameters<typeof readRawBody>[0]): Promise<Record<string, unknown>> {
  const contentLength = Number(getHeader(event, 'content-length') || 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_GRAPHQL_BODY_BYTES) {
    throw new GraphqlSecurityError(413, 'GraphQL request too large')
  }
  const raw = await readRawBody(event, 'utf8')
  if (!raw || Buffer.byteLength(raw, 'utf8') > MAX_GRAPHQL_BODY_BYTES) {
    throw new GraphqlSecurityError(413, 'GraphQL request too large')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new GraphqlSecurityError(400, 'Invalid request body')
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new GraphqlSecurityError(400, 'Invalid GraphQL request body')
  }
  return parsed as Record<string, unknown>
}

/**
 * Public read-only GraphQL proxy towards WordPress. It never forwards the
 * WordPress credentials: with them, any valid read query sent by a visitor
 * would run with server privileges.
 */
export default defineEventHandler(async (event) => {
  assertMethod(event, 'POST')

  let body: Record<string, unknown>
  let safe: ReturnType<typeof validateGraphqlReadOnly>
  try {
    body = await readGraphqlBody(event)
    const unsupported = Object.keys(body).find((key) => !ALLOWED_BODY_KEYS.has(key))
    if (unsupported) throw new GraphqlSecurityError(400, `Unsupported GraphQL request field: ${unsupported}`)

    const { operationName } = body
    if (operationName !== undefined && (
      typeof operationName !== 'string'
      || operationName.length > 128
      || !/^[_A-Za-z][_0-9A-Za-z]*$/.test(operationName)
    )) {
      throw new GraphqlSecurityError(400, 'Invalid GraphQL operation name')
    }
    safe = validateGraphqlReadOnly(body.query, body.variables)
  } catch (error) {
    rethrowSecurityError(error)
  }

  const endpoint = useRuntimeConfig(event).wpGraphqlUrl
  let result: GraphqlResponse<unknown>
  try {
    result = await $fetch<GraphqlResponse<unknown>>(endpoint, {
      method: 'POST',
      body: {
        query: safe.query,
        variables: safe.variables,
        ...(typeof body.operationName === 'string' ? { operationName: body.operationName } : {}),
      },
      timeout: 20_000,
    })
  } catch (error) {
    const status = error instanceof Error && 'statusCode' in error ? error.statusCode : 'unknown'
    console.error(`[graphql] upstream request failed (status=${String(status)})`)
    throw createError({ statusCode: 502, statusMessage: 'GraphQL upstream unavailable' })
  }

  if (result.errors?.length) {
    console.error(`[graphql] upstream returned ${result.errors.length} error(s)`)
    throw createError({ statusCode: 502, statusMessage: 'Upstream GraphQL query failed' })
  }
  return result
})
