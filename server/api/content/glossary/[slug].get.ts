import type { GlossaryPage } from '#shared/types/content'
import type { WpImageEdge, WpSeo } from '#shared/types/wordpress'

interface GlossaryNode {
  title: string
  slug: string
  content: string | null
  date: string
  modified: string
  authorName: string | null
  seo: WpSeo | null
  featuredImage: WpImageEdge | null
}

const GLOSSARY_QUERY = `
  query GlossaryTerm($slug: String!) {
    glossaryTermBy(slug: $slug) {
      title slug content date modified authorName
      seo { title metaDesc opengraphTitle opengraphDescription opengraphImage { sourceUrl } }
      featuredImage { node { sourceUrl altText } }
    }
  }
`

export default defineCachedEventHandler(async (event): Promise<GlossaryPage> => {
  const slug = getRouterParam(event, 'slug') ?? ''
  let term: GlossaryNode | null
  try {
    ;({ glossaryTermBy: term } = await wpQuery<{ glossaryTermBy: GlossaryNode | null }>(event, GLOSSARY_QUERY, { slug }))
  } catch (error) {
    throw toHttpError(error)
  }
  if (!term) throw createError({ statusCode: 404, statusMessage: 'Pagina non trovata' })

  const image = term.featuredImage?.node
  return {
    type: 'glossary',
    title: decodeEntities(term.title),
    slug: term.slug,
    date: term.date,
    modified: term.modified,
    authorName: displayAuthorName(term.authorName),
    seo: term.seo,
    featuredImage: image ? { sourceUrl: image.sourceUrl, altText: image.altText ?? '' } : null,
    readingTime: readingTimeMinutes(term.content),
    content: structureContent(term.content),
  }
}, {
  name: 'content-glossary',
  maxAge: 60,
  swr: true,
  getKey: (event) => getRouterParam(event, 'slug') ?? '',
})
