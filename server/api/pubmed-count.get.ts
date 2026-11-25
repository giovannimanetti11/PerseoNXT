interface ESearchResult {
  esearchresult?: { count?: string }
}

/** Number of PubMed articles for a binomial name. The API key stays on the server. */
export default defineCachedEventHandler(async (event): Promise<{ count: number }> => {
  const term = String(getQuery(event).term ?? '').trim()
  if (!term || term.length > 200) throw createError({ statusCode: 400, statusMessage: 'Parametro term mancante' })

  const apiKey = useRuntimeConfig(event).pubmedApiKey
  try {
    const result = await $fetch<ESearchResult>('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
      query: { db: 'pubmed', term, retmode: 'json', ...(apiKey ? { api_key: apiKey } : {}) },
      timeout: 10_000,
    })
    return { count: Number(result.esearchresult?.count ?? 0) || 0 }
  } catch (error) {
    // Not cached: Nitro only stores successful responses.
    console.error('[pubmed] request failed:', error instanceof Error ? error.message : error)
    throw createError({ statusCode: 502, statusMessage: 'PubMed non disponibile' })
  }
}, {
  name: 'pubmed-count',
  maxAge: 60 * 60 * 24,
  getKey: (event) => String(getQuery(event).term ?? '').trim().toLowerCase(),
})
