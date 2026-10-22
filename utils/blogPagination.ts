export const BLOG_POSTS_PER_PAGE = 6
export const MAX_BLOG_PAGE = 50

export interface BlogConnection<T> {
  nodes: T[]
  pageInfo: {
    hasNextPage: boolean
    endCursor: string | null
  }
}

export interface BlogPage<T> {
  posts: T[]
  hasNextPage: boolean
}

export function parseBlogPage(value: unknown): number | null {
  if (value === undefined) return 1
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null

  const page = Number(value)
  return Number.isSafeInteger(page) && page <= MAX_BLOG_PAGE ? page : null
}

/**
 * The featured article occupies the first slot on page one.
 * Fetching each GraphQL connection in order keeps numbered URLs stable
 * without relying on an optional WordPress offset-pagination extension.
 */
export async function loadBlogPage<T>(
  page: number,
  fetchConnection: (first: number, after: string | null) => Promise<BlogConnection<T>>,
): Promise<BlogPage<T> | null> {
  if (!Number.isInteger(page) || page < 1 || page > MAX_BLOG_PAGE) return null

  let after: string | null = null

  for (let current = 1; current <= page; current += 1) {
    const first = current === 1 ? BLOG_POSTS_PER_PAGE + 1 : BLOG_POSTS_PER_PAGE
    const connection = await fetchConnection(first, after)

    if (!connection || !Array.isArray(connection.nodes) || !connection.pageInfo) {
      throw new Error('Invalid blog connection returned by WordPress')
    }
    if (connection.nodes.length === 0) return null

    if (current === page) {
      return {
        posts: connection.nodes,
        hasNextPage: Boolean(connection.pageInfo.hasNextPage),
      }
    }

    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) {
      return null
    }
    after = connection.pageInfo.endCursor
  }

  return null
}

export function plainBlogExcerpt(html: string | null | undefined): string {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#(?:8217|x2019);/gi, '’')
    .replace(/&#(?:8230|x2026);|&hellip;/gi, '…')
    .replace(/\s+/g, ' ')
    .trim()
}
