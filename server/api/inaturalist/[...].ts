import { defineEventHandler, createError, getQuery } from 'h3'

// Whitelist of allowed iNaturalist API path patterns
const ALLOWED_INATURALIST_PATHS = [
  /^\/v1\/observations$/,
  /^\/v1\/taxa\/autocomplete$/,
  /^\/v1\/taxa\/\d+$/,
]

export default defineEventHandler(async (event) => {
  try {
    const params = event.context.params?._ || ''
    const query = getQuery(event)

    const path = `/${params}`

    // Validate against whitelist before proxying
    const isAllowed = ALLOWED_INATURALIST_PATHS.some(pattern => pattern.test(path))
    if (!isAllowed) {
      throw createError({
        statusCode: 403,
        message: `iNaturalist path not allowed: ${path}`
      })
    }

    // Build the full path with query string
    const queryString = new URLSearchParams(query as Record<string, string>).toString()
    const fullPath = `${path}${queryString ? `?${queryString}` : ''}`

    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Wikiherbalist/1.0',
    }

    const response = await fetch(`https://api.inaturalist.org${fullPath}`, { headers })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `iNaturalist API responded with status: ${response.status}`
      })
    }

    const data = await response.json()

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
