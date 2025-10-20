import { defineEventHandler, createError } from 'h3'
import { apiConfig } from '@config'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const applicationId = config.public.algolia.applicationId
    const apiKey = config.public.algolia.apiKey // Search key pubblica va bene per count
    const indexName = 'wikiherbalist'

    if (!apiKey || !applicationId) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error: Algolia credentials missing'
      })
    }

    // Verifica se l'indice esiste
    const checkIndexUrl = `https://${applicationId}.algolia.net/1/indexes/${indexName}`
    const headers = {
      'Content-Type': 'application/json',
      'X-Algolia-API-Key': apiKey,
      'X-Algolia-Application-ID': applicationId
    }

    const checkResponse = await fetch(checkIndexUrl, {
      method: 'GET',
      headers
    })

    if (!checkResponse.ok) {
      return {
        count: 0,
        message: 'Index does not exist yet or is not accessible'
      }
    }

    const indexData = await checkResponse.json()
    
    return {
      count: indexData.nbRecords || 0,
      entries: indexData.entries || 0,
      dataSize: indexData.dataSize || 0,
      fileSize: indexData.fileSize || 0
    }

  } catch (error: any) {
    console.error('Error fetching Algolia count:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch Algolia count'
    })
  }
})
