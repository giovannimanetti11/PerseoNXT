const MAX_QUERY_LENGTH = 32_000

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const config = useRuntimeConfig()

  let body: { query?: unknown; variables?: unknown }
  try {
    body = await readBody(event)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body'
    })
  }

  if (!body || typeof body.query !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Query is required'
    })
  }

  const query = body.query.trim()
  if (!query || query.length > MAX_QUERY_LENGTH) {
    throw createError({
      statusCode: 413,
      statusMessage: 'GraphQL query is empty or too large'
    })
  }

  // This endpoint is a public read-only proxy. Never forward an authenticated
  // WordPress session or application password from a public request.
  if (/\b(mutation|subscription)\b/i.test(query)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only read-only GraphQL queries are allowed'
    })
  }

  if (/\b__(schema|type)\b/.test(query)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'GraphQL introspection is not allowed'
    })
  }

  const endpoint = config.graphqlEndpoint || config.wpBaseUrl
  if (!endpoint) {
    throw createError({
      statusCode: 503,
      statusMessage: 'GraphQL service unavailable'
    })
  }

  try {
    const result = await $fetch<any>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        query,
        variables: body.variables || {}
      }
    })

    if (result.errors) {
      throw createError({
        statusCode: 502,
        statusMessage: 'GraphQL upstream query failed'
      })
    }

    return result
  } catch (error: any) {
    if (error?.statusCode && error.statusCode < 500) {
      throw error
    }
    console.error('GraphQL upstream request failed')
    throw createError({
      statusCode: 502,
      statusMessage: 'GraphQL upstream unavailable'
    })
  }
})
