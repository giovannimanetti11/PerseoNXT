/**
 * Composable for making GraphQL queries using Nuxt's native $fetch
 * This replaces Apollo Client with a simpler, Nuxt-native approach
 */
export function useGraphQL() {
  /**
   * Transform URLs in GraphQL response to use correct domain for media files
   * WordPress returns admin.wikiherbalist.com URLs, but media is served from wikiherbalist.com
   * @param data - Any data structure (string, array, object)
   * @returns Transformed data with corrected URLs
   */
  const transformMediaUrls = (data: any): any => {
    // Handle string values - replace admin domain with main domain for wp-content paths
    if (typeof data === 'string') {
      return data.replace(
        /https?:\/\/admin\.wikiherbalist\.com\/wp-content\//g,
        'https://wikiherbalist.com/wp-content/'
      )
    }

    // Handle arrays recursively
    if (Array.isArray(data)) {
      return data.map(transformMediaUrls)
    }

    // Handle objects recursively
    if (data && typeof data === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(data)) {
        result[key] = transformMediaUrls(value)
      }
      return result
    }

    // Return primitive values as-is
    return data
  }

  /**
   * Execute a GraphQL query
   * @param queryString - GraphQL query string
   * @param variables - Optional query variables
   * @returns Promise with GraphQL response data (with transformed URLs)
   */
  const query = async <T = any>(queryString: string, variables?: Record<string, any>): Promise<T> => {
    const result = await $fetch<{ data: T, errors?: any[] }>('/api/graphql', {
      method: 'POST',
      body: {
        query: queryString,
        variables: variables || {}
      }
    })

    if (result.errors) {
      console.error('GraphQL errors:', result.errors)
      throw new Error('GraphQL query failed')
    }

    // Transform all URLs in the response to use correct domain
    return transformMediaUrls(result.data)
  }

  return {
    query
  }
}
