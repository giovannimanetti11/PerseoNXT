import { defineEventHandler, readBody, createError } from 'h3'
import { apiConfig } from '@config'

interface UpdateRequest {
  password: string
  posts: any[]
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
    if (!Array.isArray(body.posts) || body.posts.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: posts array is required'
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
    const records = body.posts.map(post => ({
      objectID: post.databaseId.toString(),
      title: post.title,
      excerpt: post.excerpt?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
      content: post.content?.replace(/<[^>]*>/g, '').substring(0, 500) || '',
      slug: post.slug,
      uri: post.uri,
      date: post.date,
      featuredImage: post.featuredImage?.node?.sourceUrl || null,
      categories: post.categories?.nodes?.map((cat: any) => cat.name) || [],
      tags: post.tags?.nodes?.map((tag: any) => tag.name) || []
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
      message: `Successfully updated ${totalProcessed} blog posts`,
      totalProcessed,
      batches: batches.length,
      results
    }

  } catch (error: any) {
    console.error('Error updating Algolia blog posts:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update Algolia index'
    })
  }
})
