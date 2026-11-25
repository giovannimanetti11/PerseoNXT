import type { PlantPage } from '#shared/types/content'
import type { WpImage, WpImageEdge, WpSeo, WpTag } from '#shared/types/wordpress'

interface PlantNode {
  title: string
  slug: string
  content: string | null
  date: string
  modified: string
  authorName: string | null
  nomeScientifico: string | null
  nomeComune: string | null
  partiUsate: string | null
  costituenti: string | null
  interazioniFarmaci: string | null
  interazioniSource: string | null
  emaMonografiaUrl: string | null
  emaPageUrl: string | null
  drugscomUrl: string | null
  seo: WpSeo | null
  revisionData: { date: string }[] | null
  featuredImage: WpImageEdge | null
  additionalImages: WpImage[] | null
  tags: { nodes: WpTag[] } | null
}

const PLANT_QUERY = `
  query Plant($slug: String!) {
    postBy(slug: $slug) {
      title slug content date modified authorName
      nomeScientifico nomeComune partiUsate costituenti
      interazioniFarmaci interazioniSource emaMonografiaUrl emaPageUrl drugscomUrl
      seo { title metaDesc opengraphTitle opengraphDescription opengraphImage { sourceUrl } }
      revisionData { date }
      featuredImage { node { sourceUrl altText } }
      additionalImages { sourceUrl altText }
      tags(first: 100) { nodes { id name description } }
    }
  }
`

export default defineCachedEventHandler(async (event): Promise<PlantPage> => {
  const slug = getRouterParam(event, 'slug') ?? ''
  let post: PlantNode | null
  try {
    ;({ postBy: post } = await wpQuery<{ postBy: PlantNode | null }>(event, PLANT_QUERY, { slug }))
  } catch (error) {
    throw toHttpError(error)
  }
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Pagina non trovata' })

  const hasInteractions = Boolean(post.interazioniFarmaci?.trim()) && post.interazioniSource !== 'none'
  const image = post.featuredImage?.node

  return {
    type: 'plant',
    title: decodeEntities(post.title),
    slug: post.slug,
    date: post.date,
    modified: post.modified,
    authorName: displayAuthorName(post.authorName),
    seo: post.seo,
    featuredImage: image ? { sourceUrl: image.sourceUrl, altText: image.altText ?? '' } : null,
    readingTime: readingTimeMinutes(post.content),
    content: structureContent(post.content),
    nomeScientifico: post.nomeScientifico ?? '',
    nomeComune: splitList(post.nomeComune),
    partiUsate: splitList(post.partiUsate),
    costituenti: post.costituenti ?? '',
    interazioni: hasInteractions
      ? {
          text: post.interazioniFarmaci ?? '',
          source: post.interazioniSource ?? '',
          emaMonografiaUrl: post.emaMonografiaUrl ?? '',
          emaPageUrl: post.emaPageUrl ?? '',
          drugscomUrl: post.drugscomUrl ?? '',
        }
      : null,
    revisionDates: (post.revisionData ?? []).map((revision) => revision.date).filter(Boolean),
    additionalImages: (post.additionalImages ?? [])
      .filter((img) => img?.sourceUrl)
      .map((img) => ({ sourceUrl: img.sourceUrl, altText: img.altText ?? '' })),
    tags: post.tags?.nodes ?? [],
  }
}, {
  name: 'content-plant',
  maxAge: 60,
  swr: true,
  getKey: (event) => getRouterParam(event, 'slug') ?? '',
})
