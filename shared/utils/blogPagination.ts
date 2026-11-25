export const BLOG_POSTS_PER_PAGE = 6
export const MAX_BLOG_PAGE = 50
const FIRST_PAGE_SIZE = BLOG_POSTS_PER_PAGE + 1

export interface BlogConnection<T> {
  nodes: T[]
  pageInfo: {
    hasNextPage: boolean
    endCursor: string | null
  }
}

export interface BlogPageSlice<T> {
  featuredPost: T | null
  otherPosts: T[]
  hasNextPage: boolean
  totalPages: number
}

export function parseBlogPage(value: unknown): number | null {
  if (value === undefined) return 1
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null

  const page = Number(value)
  return Number.isSafeInteger(page) && page <= MAX_BLOG_PAGE ? page : null
}

/**
 * Fetch the blog index once per visit (currently 16 posts).
 * WordPress GraphQL allows at most 100 per connection.
 * Future growth beyond 50 blog pages can be handled separately.
 */
export async function loadBlogPosts<T>(
  fetchConnection: (first: number, after: string | null) => Promise<BlogConnection<T>>,
): Promise<T[]> {
  const posts: T[] = []
  const maximum = 1 + MAX_BLOG_PAGE * BLOG_POSTS_PER_PAGE
  let after: string | null = null

  while (posts.length < maximum) {
    const first = Math.min(100, maximum - posts.length)
    const connection = await fetchConnection(first, after)
    if (!connection || !Array.isArray(connection.nodes) || !connection.pageInfo) {
      throw new Error('Invalid blog connection returned by WordPress')
    }
    posts.push(...connection.nodes)
    if (!connection.pageInfo.hasNextPage) break
    if (!connection.pageInfo.endCursor || connection.pageInfo.endCursor === after || !connection.nodes.length) {
      throw new Error('WordPress returned an invalid blog pagination cursor')
    }
    after = connection.pageInfo.endCursor
  }

  return posts
}

export function paginateBlogPosts<T>(posts: T[], page: number): BlogPageSlice<T> | null {
  if (!Number.isInteger(page) || page < 1 || page > MAX_BLOG_PAGE) return null

  const totalPages = 1 + Math.ceil(Math.max(0, posts.length - FIRST_PAGE_SIZE) / BLOG_POSTS_PER_PAGE)
  if (page > totalPages) return null

  const start = FIRST_PAGE_SIZE + (page - 2) * BLOG_POSTS_PER_PAGE
  return {
    featuredPost: page === 1 ? posts[0] ?? null : null,
    otherPosts: page === 1
      ? posts.slice(1, FIRST_PAGE_SIZE)
      : posts.slice(start, start + BLOG_POSTS_PER_PAGE),
    hasNextPage: page < totalPages,
    totalPages,
  }
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
