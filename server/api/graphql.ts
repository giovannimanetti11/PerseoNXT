export default defineEventHandler(async (event) => {
  // Only accept POST requests
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const config = useRuntimeConfig()

  let body
  try {
    // Read the body
    body = await readBody(event)
  } catch (error) {
    console.error('Failed to read body:', error)
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body'
    })
  }

  // Validate request body
  if (!body || !body.query) {
    console.error('Invalid GraphQL request. Body:', body)
    throw createError({
      statusCode: 400,
      statusMessage: 'Query is required'
    })
  }

  // Prepare GraphQL endpoint
  // Use HTTP localhost:8080 for SSR to avoid Cloudflare Origin Certificate issues
  // Port 8080 is configured for local-only access in Apache
  const endpoint = 'http://127.0.0.1:8080/graphql'

  // Prepare headers with Basic Auth
  const credentials = `${config.wpUsername}:${config.wpAppPassword}`
  const authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`

  try {
    // Make GraphQL request
    const result = await $fetch<any>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: {
        query: body.query,
        variables: body.variables || {}
      }
    })

    // Check for GraphQL errors
    if (result.errors) {
      console.error('GraphQL errors:', result.errors)
      throw createError({
        statusCode: 500,
        statusMessage: 'GraphQL query failed',
        data: result.errors
      })
    }

    // Return the data
    return result
  } catch (error: any) {
    console.error('GraphQL request failed:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch data from GraphQL'
    })
  }
})
