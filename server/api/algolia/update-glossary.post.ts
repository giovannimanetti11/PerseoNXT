import { defineEventHandler, readBody, createError } from 'h3'
import { apiConfig } from '@config'

interface UpdateRequest {
  password: string
  terms: any[]
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<UpdateRequest>(event)
    
    // Verifica password
    if (body.password !== apiConfig.algoliaAccessPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Invalid password'
      })
    }

    // Validazione input
    if (!Array.isArray(body.terms) || body.terms.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: terms array is required'
      })
    }

    const config = useRuntimeConfig()
    const applicationId = config.public.algolia.applicationId
    const apiKey = apiConfig.algoliaWriteAPIKey // Chiave sicura lato server
    const indexName = 'wikiherbalist'

    if (!apiKey || !applicationId) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error: Algolia credentials missing'
      })
    }

    // Prepara i record per Algolia
    const records = body.terms.map(term => ({
      objectID: term.databaseId.toString(),
      name: term.name,
      description: term.description?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
      slug: term.slug,
      uri: term.uri,
      count: term.count || 0
    }))

    // Batch update con Algolia REST API
    const baseUrl = `https://${applicationId}.algolia.net/1/indexes/${indexName}/batch`
    const headers = {
      'Content-Type': 'application/json',
      'X-Algolia-API-Key': apiKey,
      'X-Algolia-Application-ID': applicationId
    }

    const batchSize = 100
    const batches = []
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      batches.push(batch)
    }

    let totalProcessed = 0
    const results = []

    for (const batch of batches) {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          requests: batch.map(record => ({
            action: 'updateObject',
            body: record
          }))
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw createError({
          statusCode: response.status,
          statusMessage: `Algolia API error: ${errorText}`
        })
      }

      const result = await response.json()
      results.push(result)
      totalProcessed += batch.length
    }

    return {
      success: true,
      message: `Successfully updated ${totalProcessed} glossary terms`,
      totalProcessed,
      batches: batches.length,
      results
    }

  } catch (error: any) {
    console.error('Error updating Algolia glossary:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update Algolia index'
    })
  }
})
