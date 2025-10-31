/**
 * Composable for making GraphQL queries using Nuxt's native $fetch
 * This replaces Apollo Client with a simpler, Nuxt-native approach
 */
export function useGraphQL() {
  /**
   * Execute a GraphQL query
   * @param queryString - GraphQL query string
   * @param variables - Optional query variables
   * @returns Promise with GraphQL response data
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

    return result.data
  }

  return {
    query
  }
}
