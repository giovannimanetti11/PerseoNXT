import { describe, expect, it } from 'vitest'
import { buildCitation, citationText } from '~/utils/citation'
import { renderSitemap } from '../../server/utils/sitemap'

const source = {
  title: 'Zenzero',
  author: 'Redazione di Wikiherbalist',
  published: '2023-03-15T10:00:00',
  url: 'https://wikiherbalist.com/zingiber-officinale',
}
const accessed = new Date('2026-11-25T12:00:00Z')

describe('buildCitation', () => {
  it('italicizes title and site name in MLA', () => {
    const parts = buildCitation('MLA', source, accessed)
    expect(parts.filter((part) => part.italic).map((part) => part.text)).toEqual(['Zenzero', 'Wikiherbalist'])
    expect(citationText(parts)).toBe('Redazione di Wikiherbalist. "Zenzero." Wikiherbalist, 15 March 2023, https://wikiherbalist.com/zingiber-officinale. Accessed 25 November 2026.')
  })

  it('produces a Wikipedia cite template', () => {
    expect(citationText(buildCitation('Wikipedia', source, accessed))).toBe(
      '{{cite web |title=Zenzero |url=https://wikiherbalist.com/zingiber-officinale |website=Wikiherbalist |author=Redazione di Wikiherbalist |date=2023-03-15 |access-date=2026-11-25}}',
    )
  })
})

describe('renderSitemap', () => {
  it('escapes URLs and image titles', () => {
    const xml = renderSitemap([{
      path: '/blog/a&b',
      lastmod: '2026-01-02T00:00:00',
      changefreq: 'weekly',
      priority: 0.7,
      image: { loc: 'https://wikiherbalist.com/wp-content/x.jpg', title: 'Foglie <e> fiori' },
    }])
    expect(xml).toContain('<loc>https://wikiherbalist.com/blog/a&amp;b</loc>')
    expect(xml).toContain('<image:title>Foglie &lt;e&gt; fiori</image:title>')
    expect(xml).toContain('<lastmod>2026-01-02</lastmod>')
    expect(xml).toContain('<priority>0.7</priority>')
  })
})
