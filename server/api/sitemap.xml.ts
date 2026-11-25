import type { SitemapEntry } from '../utils/sitemap'
import type { ContentType } from '#shared/types/content'
import type { WpConnection, WpImageEdge } from '#shared/types/wordpress'

interface SitemapNode {
  slug: string
  date?: string | null
  modified?: string | null
  title?: string | null
  featuredImage?: WpImageEdge | null
}

const STATIC_PAGES: SitemapEntry[] = [
  { path: '/', changefreq: 'daily', priority: 1 },
  { path: '/piante-medicinali', changefreq: 'weekly', priority: 0.8 },
  { path: '/glossario', changefreq: 'weekly', priority: 0.8 },
  { path: '/blog', changefreq: 'weekly', priority: 0.8 },
  { path: '/about', changefreq: 'monthly', priority: 0.8 },
  { path: '/lavora-con-noi', changefreq: 'monthly', priority: 0.6 },
  { path: '/donazioni', changefreq: 'monthly', priority: 0.5 },
  { path: '/disclaimer', changefreq: 'monthly', priority: 0.5 },
  { path: '/privacy-policy', changefreq: 'monthly', priority: 0.5 },
  { path: '/cookie-policy', changefreq: 'monthly', priority: 0.5 },
]

const SOURCES: { type: ContentType; connection: string; query: string; changefreq: SitemapEntry['changefreq']; priority: number }[] = [
  {
    type: 'plant',
    connection: 'posts',
    changefreq: 'weekly',
    priority: 0.7,
    query: `query SitemapPlants($first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { status: PUBLISH }) {
        nodes { slug date modified title featuredImage { node { sourceUrl altText } } }
        pageInfo { hasNextPage endCursor }
      }
    }`,
  },
  {
    type: 'blog',
    connection: 'blogPosts',
    changefreq: 'weekly',
    priority: 0.7,
    query: `query SitemapBlog($first: Int!, $after: String) {
      blogPosts(first: $first, after: $after) {
        nodes { slug date modified }
        pageInfo { hasNextPage endCursor }
      }
    }`,
  },
  {
    type: 'glossary',
    connection: 'glossaryTerms',
    changefreq: 'monthly',
    priority: 0.6,
    query: `query SitemapGlossary($first: Int!, $after: String) {
      glossaryTerms(first: $first, after: $after) {
        nodes { slug date modified }
        pageInfo { hasNextPage endCursor }
      }
    }`,
  },
]

async function contentEntries(event: Parameters<typeof wpQueryAll>[0]): Promise<SitemapEntry[]> {
  const groups = await Promise.all(SOURCES.map(async (source) => {
    const nodes = await wpQueryAll<Record<string, WpConnection<SitemapNode>>, SitemapNode>(
      event,
      source.query,
      (data) => data[source.connection],
      { timeoutMs: 30_000, retries: 2 },
    )
    return nodes.filter((node) => node.slug).map((node): SitemapEntry => {
      const image = node.featuredImage?.node
      return {
        path: contentPath(source.type, node.slug),
        lastmod: node.modified || node.date || undefined,
        changefreq: source.changefreq,
        priority: source.priority,
        image: image?.sourceUrl
          ? { loc: publicMediaUrl(image.sourceUrl), title: image.altText || decodeEntities(node.title ?? '') }
          : undefined,
      }
    })
  }))
  return groups.flat()
}

export default defineCachedEventHandler(async (event) => {
  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'x-content-type-options', 'nosniff')

  try {
    return renderSitemap([...STATIC_PAGES, ...(await contentEntries(event))])
  } catch (error) {
    // 503 tells crawlers to come back later; error responses are not cached.
    console.error('[sitemap] WordPress unavailable:', error instanceof Error ? error.message : error)
    setResponseHeader(event, 'cache-control', 'no-cache')
    throw createError({ statusCode: 503, statusMessage: 'Sitemap temporaneamente non disponibile' })
  }
}, {
  name: 'sitemap',
  maxAge: 60 * 60,
  swr: true,
})
