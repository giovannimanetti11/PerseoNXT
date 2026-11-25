import type { GraphqlResponse } from '#shared/types/wordpress'

/** Rewrites admin.wikiherbalist.com/wp-content URLs in every string of the response. */
function rewriteMediaUrls<T>(value: T): T {
  if (typeof value === 'string') return publicMediaUrl(value) as T
  if (Array.isArray(value)) return value.map((item) => rewriteMediaUrls(item)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, rewriteMediaUrls(item)]),
    ) as T
  }
  return value
}

/**
 * Read-only GraphQL queries through the /api/graphql proxy.
 * `T` describes the `data` object the query returns.
 */
export function useGraphQL() {
  const query = async <T>(queryString: string, variables: Record<string, unknown> = {}): Promise<T> => {
    const result = await $fetch<GraphqlResponse<T>>('/api/graphql', {
      method: 'POST',
      body: { query: queryString, variables },
    })
    if (result.errors?.length || !result.data) {
      throw new Error('GraphQL query failed')
    }
    return rewriteMediaUrls(result.data)
  }

  return { query }
}
