import { defineEventHandler, createError, getQuery } from 'h3'

// Whitelist of allowed GBIF API path patterns
const ALLOWED_GBIF_PATHS = [
  /^\/v1\/species\/match$/,
  /^\/v1\/occurrence\/search$/,
  /^\/v1\/species\/\d+$/,
  /^\/v1\/species\/\d+\/synonyms$/,
]

export default defineEventHandler(async (event) => {
  try {
    // Get the catch-all path segments
    const params = event.context.params?._ || ''
    const query = getQuery(event)

    const path = `/${params}`

    // Validate against whitelist before proxying
    const isAllowed = ALLOWED_GBIF_PATHS.some(pattern => pattern.test(path))
    if (!isAllowed) {
      throw createError({
        statusCode: 403,
        message: `GBIF path not allowed: ${path}`
      })
    }

    // Build the full path with query string
    const queryString = new URLSearchParams(query as Record<string, string>).toString()
    const fullPath = `${path}${queryString ? `?${queryString}` : ''}`

    // Set up request headers
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Wikiherbalist/1.0',
      'Content-Type': 'application/json'
    }

    // Make the request to GBIF
    const response = await fetch(`https://api.gbif.org${fullPath}`, { headers })

    // Check if the response is ok
    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `GBIF API responded with status: ${response.status}`
      })
    }

    // Get the JSON data
    const data = await response.json()
    
    // Set response headers
    event.node.res.setHeader('Content-Type', 'application/json')
    event.node.res.setHeader('Cache-Control', 'public, max-age=300')

    return data
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal Server Error'
    })
  }
})