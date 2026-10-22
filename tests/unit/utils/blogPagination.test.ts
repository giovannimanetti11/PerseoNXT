import { describe, expect, it, vi } from 'vitest'
import { BLOG_POSTS_PER_PAGE, loadBlogPage, parseBlogPage, plainBlogExcerpt } from '../../../utils/blogPagination'

describe('blog pagination', () => {
  it('validates page query parameters', () => {
    expect(parseBlogPage(undefined)).toBe(1)
    expect(parseBlogPage('1')).toBe(1)
    expect(parseBlogPage('3')).toBe(3)
    for (const value of ['0', '-1', '01', '1.5', '51', 'abc', '', null, ['2']]) {
      expect(parseBlogPage(value)).toBeNull()
    }
  })

  it('keeps the featured post separate and advances cursors correctly', async () => {
    const data = Array.from({ length: 16 }, (_, i) => i + 1)
    const fetchConnection = vi.fn(async (first: number, after: string | null) => {
      const start = after ? Number(after) : 0
      const nodes = data.slice(start, start + first)
      const end = start + nodes.length
      return {
        nodes,
        pageInfo: { hasNextPage: end < data.length, endCursor: String(end) },
      }
    })

    const first = await loadBlogPage(1, fetchConnection)
    expect(first).toEqual({ posts: [1, 2, 3, 4, 5, 6, 7], hasNextPage: true })
    const second = await loadBlogPage(2, fetchConnection)
    expect(second).toEqual({ posts: [8, 9, 10, 11, 12, 13], hasNextPage: true })
    const third = await loadBlogPage(3, fetchConnection)
    expect(third).toEqual({ posts: [14, 15, 16], hasNextPage: false })
    expect(await loadBlogPage(4, fetchConnection)).toBeNull()
    expect(fetchConnection).toHaveBeenCalledWith(BLOG_POSTS_PER_PAGE + 1, null)
    expect(fetchConnection).toHaveBeenCalledWith(BLOG_POSTS_PER_PAGE, '7')
  })

  it('rejects malformed or unbounded pages without querying', async () => {
    const fetchConnection = vi.fn()
    expect(await loadBlogPage(0, fetchConnection)).toBeNull()
    expect(await loadBlogPage(51, fetchConnection)).toBeNull()
    expect(await loadBlogPage(1.5, fetchConnection)).toBeNull()
    expect(fetchConnection).not.toHaveBeenCalled()
  })

  it('removes markup and normalizes excerpts for text-only cards', () => {
    expect(plainBlogExcerpt('<p>Erbe &amp; salute &#8217; oggi</p>')).toBe('Erbe & salute ’ oggi')
    expect(plainBlogExcerpt('')).toBe('')
    expect(plainBlogExcerpt(null)).toBe('')
  })
})
