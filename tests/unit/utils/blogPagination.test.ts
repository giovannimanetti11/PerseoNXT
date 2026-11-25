import { describe, expect, it, vi } from 'vitest'
import { BLOG_POSTS_PER_PAGE, loadBlogPosts, paginateBlogPosts, parseBlogPage, plainBlogExcerpt } from '../../../shared/utils/blogPagination'

describe('blog pagination', () => {
  it('validates page query parameters', () => {
    expect(parseBlogPage(undefined)).toBe(1)
    expect(parseBlogPage('1')).toBe(1)
    expect(parseBlogPage('3')).toBe(3)
    for (const value of ['0', '-1', '01', '1.5', '51', 'abc', '', null, ['2']]) {
      expect(parseBlogPage(value)).toBeNull()
    }
  })

  it('loads posts once and paginates locally without additional queries', async () => {
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

    const posts = await loadBlogPosts(fetchConnection)
    expect(posts).toEqual(data)
    expect(fetchConnection).toHaveBeenCalledTimes(1)
    expect(paginateBlogPosts(posts, 1)).toEqual({
      featuredPost: 1, otherPosts: [2, 3, 4, 5, 6, 7], hasNextPage: true, totalPages: 3,
    })
    expect(paginateBlogPosts(posts, 2)).toEqual({
      featuredPost: null, otherPosts: [8, 9, 10, 11, 12, 13], hasNextPage: true, totalPages: 3,
    })
    expect(paginateBlogPosts(posts, 3)).toEqual({
      featuredPost: null, otherPosts: [14, 15, 16], hasNextPage: false, totalPages: 3,
    })
    expect(paginateBlogPosts(posts, 4)).toBeNull()
    expect(fetchConnection).toHaveBeenCalledTimes(1)
    expect(BLOG_POSTS_PER_PAGE).toBe(6)
  })

  it('handles empty blogs and validates page boundaries', () => {
    expect(paginateBlogPosts([], 1)).toEqual({
      featuredPost: null, otherPosts: [], hasNextPage: false, totalPages: 1,
    })
    expect(paginateBlogPosts([], 2)).toBeNull()
    expect(paginateBlogPosts([1, 2], 0)).toBeNull()
    expect(paginateBlogPosts([1, 2], 51)).toBeNull()
  })

  it('follows WordPress cursors only when the index exceeds 100 entries', async () => {
    const data = Array.from({ length: 114 }, (_, i) => i + 1)
    const callback = vi.fn(async (first: number, after: string | null) => {
      const start = after ? Number(after) : 0
      const nodes = data.slice(start, start + first)
      const end = start + nodes.length
      return {
        nodes,
        pageInfo: { hasNextPage: end < data.length, endCursor: String(end) },
      }
    })
    expect((await loadBlogPosts(callback)).length).toBe(114)
    expect(callback).toHaveBeenCalledTimes(2)
    expect(paginateBlogPosts(data, 2)?.otherPosts).toEqual([8,9,10,11,12,13])
  })

  it('removes markup and normalizes excerpts for text-only cards', () => {
    expect(plainBlogExcerpt('<p>Erbe &amp; salute &#8217; oggi</p>')).toBe('Erbe & salute ’ oggi')
    expect(plainBlogExcerpt('')).toBe('')
    expect(plainBlogExcerpt(null)).toBe('')
  })
})
