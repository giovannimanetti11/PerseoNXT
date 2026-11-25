import type { BlogPage } from '#shared/types/content'
import type { WpImageEdge, WpSeo } from '#shared/types/wordpress'

interface BlogNode {
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  date: string
  modified: string
  authorName: string | null
  seo: WpSeo | null
  featuredImage: WpImageEdge | null
}

const BLOG_QUERY = `
  query BlogPost($slug: String!) {
    blogPostBy(slug: $slug) {
      title slug content excerpt date modified authorName
      seo { title metaDesc opengraphTitle opengraphDescription opengraphImage { sourceUrl } }
      featuredImage { node { sourceUrl altText } }
    }
  }
`

export default defineCachedEventHandler(async (event): Promise<BlogPage> => {
  const slug = getRouterParam(event, 'slug') ?? ''
  let post: BlogNode | null
  try {
    ;({ blogPostBy: post } = await wpQuery<{ blogPostBy: BlogNode | null }>(event, BLOG_QUERY, { slug }))
  } catch (error) {
    throw toHttpError(error)
  }
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Pagina non trovata' })

  const image = post.featuredImage?.node
  return {
    type: 'blog',
    title: decodeEntities(post.title),
    slug: post.slug,
    date: post.date,
    modified: post.modified,
    authorName: displayAuthorName(post.authorName),
    seo: post.seo,
    featuredImage: image ? { sourceUrl: image.sourceUrl, altText: image.altText ?? '' } : null,
    readingTime: readingTimeMinutes(post.content),
    content: structureContent(post.content),
    excerpt: stripHtml(post.excerpt),
  }
}, {
  name: 'content-blog',
  maxAge: 60,
  swr: true,
  getKey: (event) => getRouterParam(event, 'slug') ?? '',
})
