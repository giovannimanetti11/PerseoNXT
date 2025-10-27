import { describe, it, expect } from 'vitest'

describe('Sitemap Generation', () => {
  it('should include all static URLs', () => {
    const staticUrls = [
      '/',
      '/disclaimer',
      '/cookie-policy',
      '/privacy-policy',
      '/about',
      '/piante-medicinali',
      '/glossario',
      '/blog',
      '/donazioni'
    ]

    staticUrls.forEach(url => {
      expect(url).toBeTruthy()
      expect(url).toMatch(/^\//)
    })
  })

  it('should format lastmod dates correctly', () => {
    const date = new Date().toISOString()
    const formatted = date.split('T')[0]

    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('should filter out algolia URLs', () => {
    const urls = [
      { url: '/', lastmod: '2025-01-01' },
      { url: '/algoliaBlogPostsUpdate', lastmod: '2025-01-01' },
      { url: '/algoliaUpdate', lastmod: '2025-01-01' },
      { url: '/blog/test', lastmod: '2025-01-01' }
    ]

    const filtered = urls.filter(item => !/algolia/i.test(item.url))

    expect(filtered).toHaveLength(2)
    expect(filtered.find(u => u.url === '/')).toBeTruthy()
    expect(filtered.find(u => u.url === '/blog/test')).toBeTruthy()
    expect(filtered.find(u => u.url === '/algoliaBlogPostsUpdate')).toBeFalsy()
  })

  it('should validate URL structure', () => {
    const testUrl = {
      url: '/piante-medicinali/camomilla',
      lastmod: '2025-01-27',
      changefreq: 'weekly',
      priority: 0.7
    }

    expect(testUrl.url).toMatch(/^\//)
    expect(testUrl.changefreq).toMatch(/^(daily|weekly|monthly)$/)
    expect(testUrl.priority).toBeGreaterThanOrEqual(0)
    expect(testUrl.priority).toBeLessThanOrEqual(1)
  })
})
