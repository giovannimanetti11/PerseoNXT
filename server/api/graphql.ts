import { createError, getHeader, readRawBody } from 'h3'
import { GraphqlSecurityError, validateGraphqlReadOnly } from '../utils/graphqlSecurity'

const MAX_GRAPHQL_BODY_BYTES = 64 * 1024
const ALLOWED_BODY_KEYS = new Set(['query', 'variables', 'operationName'])

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const contentLength = Number(getHeader(event, 'content-length') || 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_GRAPHQL_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'GraphQL request too large' })
  }

  let body: Record<string, unknown>
  try {
    const raw = await readRawBody(event, 'utf8')
    if (!raw || Buffer.byteLength(raw, 'utf8') > MAX_GRAPHQL_BODY_BYTES) {
      throw new GraphqlSecurityError(413, 'GraphQL request too large')
    }
    const parsed = JSON.parse(raw)
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new GraphqlSecurityError(400, 'Invalid GraphQL request body')
    }
    body = parsed as Record<string, unknown>
  } catch (error) {
    if (error instanceof GraphqlSecurityError) {
      throw createError({ statusCode: error.statusCode, statusMessage: error.message })
    }
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_BODY_KEYS.has(key)) {
      throw createError({ statusCode: 400, statusMessage: `Unsupported GraphQL request field: ${key}` })
    }
  }

  const operationName = body.operationName
  if (operationName !== undefined && (
    typeof operationName !== 'string'
    || operationName.length > 128
    || !/^[_A-Za-z][_0-9A-Za-z]*$/.test(operationName)
  )) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid GraphQL operation name' })
  }

  let safe
  try {
    safe = validateGraphqlReadOnly(body.query, body.variables)
  } catch (error) {
    if (error instanceof GraphqlSecurityError) {
      throw createError({ statusCode: error.statusCode, statusMessage: error.message })
    }
    throw error
  }

  const config = useRuntimeConfig()
  const endpoint = config.graphqlEndpoint || config.wpBaseUrl
  if (!endpoint) {
    throw createError({ statusCode: 503, statusMessage: 'GraphQL service unavailable' })
  }

  // Public read-only proxy: never forward WordPress credentials. Authenticated
  // upstream access here would effectively expose server privileges to anyone
  // able to submit an otherwise valid read query.
  try {
    const result = await $fetch<any>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        query: safe.query,
        variables: safe.variables,
        ...(operationName ? { operationName } : {})
      }
    })

    if (result.errors) {
      console.error(`GraphQL upstream returned ${result.errors.length} error(s)`)
      throw createError({
        statusCode: 502,
        statusMessage: 'Upstream GraphQL query failed'
      })
    }

    return result
  } catch (error: any) {
    if (error?.statusCode === 502 && error?.statusMessage === 'Upstream GraphQL query failed') {
      throw error
    }
    const upstreamStatus = error?.response?.status || error?.statusCode || 'unknown'
    console.error(`GraphQL upstream request failed (status=${upstreamStatus})`)
    throw createError({
      statusCode: 502,
      statusMessage: 'GraphQL upstream unavailable'
    })
  }
})
