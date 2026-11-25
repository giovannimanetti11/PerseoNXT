import type { H3Event } from 'h3'
import type { GraphqlResponse, WpConnection } from '#shared/types/wordpress'

export class WordPressError extends Error {
  constructor(message: string, readonly upstreamStatus?: number) {
    super(message)
  }
}

interface WordPressRequestOptions {
  timeoutMs?: number
  retries?: number
}

/**
 * Runs an anonymous GraphQL query against WordPress and returns `data`: the
 * frontend only reads published content, so no credentials are sent.
 * Throws WordPressError on transport failures and on GraphQL errors.
 */
export async function wpQuery<T>(
  event: H3Event | undefined,
  query: string,
  variables: Record<string, unknown> = {},
  { timeoutMs = 20_000, retries = 1 }: WordPressRequestOptions = {},
): Promise<T> {
  const endpoint = useRuntimeConfig(event).wpGraphqlUrl

  let response: GraphqlResponse<T>
  try {
    response = await $fetch<GraphqlResponse<T>>(endpoint, {
      method: 'POST',
      body: { query, variables },
      timeout: timeoutMs,
      retry: retries,
      retryDelay: 500,
    })
  } catch (error) {
    const status = error instanceof Error && 'statusCode' in error ? Number(error.statusCode) : undefined
    throw new WordPressError('WordPress GraphQL request failed', status)
  }

  if (response.errors?.length || !response.data) {
    throw new WordPressError(`WordPress GraphQL returned ${response.errors?.length ?? 0} error(s)`)
  }
  return response.data
}

/**
 * Collects every node of a paginated connection. `select` picks the connection
 * out of the query result; the query must accept `$first` and `$after`.
 */
export async function wpQueryAll<TResult, TNode>(
  event: H3Event | undefined,
  query: string,
  select: (data: TResult) => WpConnection<TNode> | null | undefined,
  options: WordPressRequestOptions & { pageSize?: number; maxItems?: number } = {},
): Promise<TNode[]> {
  const { pageSize = 100, maxItems = 5000, ...requestOptions } = options
  const nodes: TNode[] = []
  let after: string | null = null

  while (nodes.length < maxItems) {
    const data: TResult = await wpQuery<TResult>(event, query, { first: pageSize, after }, requestOptions)
    const connection = select(data)
    if (!connection) break
    nodes.push(...connection.nodes)
    const pageInfo = connection.pageInfo
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor || pageInfo.endCursor === after) break
    after = pageInfo.endCursor
  }
  return nodes
}

/** Maps WordPress failures to HTTP errors: missing content is a 404, anything else a 502. */
export function toHttpError(error: unknown): Error {
  if (error instanceof WordPressError) {
    console.error(`[wordpress] ${error.message}${error.upstreamStatus ? ` (status ${error.upstreamStatus})` : ''}`)
    return createError({ statusCode: 502, statusMessage: 'Contenuto temporaneamente non disponibile' })
  }
  return error instanceof Error ? error : new Error(String(error))
}
