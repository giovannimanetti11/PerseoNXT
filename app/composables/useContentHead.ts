import type { BlogPage, GlossaryPage, PlantPage } from '#shared/types/content'

type ContentPage = PlantPage | GlossaryPage | BlogPage

const SECTION: Record<ContentPage['type'], { name: string; path: string }> = {
  plant: { name: 'Piante medicinali', path: '/piante-medicinali' },
  glossary: { name: 'Glossario', path: '/glossario' },
  blog: { name: 'Blog', path: '/blog' },
}

/** WordPress dates have no offset; the site works in Italian time. */
function withTimezone(date: string | undefined): string | undefined {
  if (!date) return undefined
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(date) ? date : `${date}+01:00`
}

function author(page: ContentPage) {
  return isEditorialAuthor(page.authorName)
    ? { '@type': 'Organization', name: EDITORIAL_AUTHOR, url: SITE_URL }
    : { '@type': 'Person', name: page.authorName }
}

function mainEntity(page: ContentPage, url: string, image: string): Record<string, unknown> {
  const common = {
    '@context': 'https://schema.org',
    name: page.title,
    description: page.seo?.metaDesc || page.title,
    image,
    datePublished: withTimezone(page.date),
    dateModified: withTimezone(page.modified || page.date),
    inLanguage: 'it-IT',
  }
  const publisher = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: PUBLISHER_LOGO } }

  switch (page.type) {
    case 'plant': {
      const tags = page.tags.map((tag) => tag.name)
      return {
        ...common,
        '@type': ['Article', 'MedicalWebPage'],
        '@id': `${url}#article`,
        headline: page.title,
        author: author(page),
        publisher,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        about: {
          '@type': ['Substance', 'MedicalEntity'],
          name: page.title,
          alternateName: [page.nomeScientifico, ...page.nomeComune].filter(Boolean),
          ...(page.costituenti ? { activeIngredient: stripHtml(page.costituenti) } : {}),
          relevantSpecialty: 'Phytotherapy',
        },
        specialty: 'Phytotherapy',
        medicalAudience: { '@type': 'PatientConsumerAudience', audienceType: 'patient' },
        keywords: [page.title, page.nomeScientifico, ...page.nomeComune, ...tags].filter(Boolean).join(', '),
        articleSection: 'Fitoterapia',
        isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL },
      }
    }
    case 'glossary':
      return {
        ...common,
        '@type': 'DefinedTerm',
        '@id': `${url}#term`,
        author: author(page),
        publisher,
        inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Glossario di fitoterapia', url: `${SITE_URL}/glossario` },
      }
    case 'blog':
      return {
        ...common,
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        headline: page.title,
        description: page.seo?.metaDesc || page.excerpt || page.title,
        author: author(page),
        publisher,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        articleSection: 'Fitoterapia',
      }
  }
}

/**
 * Title, meta tags, image preload and JSON-LD (breadcrumb + main entity) for a
 * monograph, glossary term or blog post. WordPress SEO titles already end with
 * "| Wikiherbalist", so the global title template is disabled here.
 */
export function useContentHead(page: Ref<ContentPage | null | undefined>) {
  const route = useRoute()

  useHead(() => {
    const value = page.value
    if (!value) return {}

    const url = canonicalUrl(route.path)
    const image = value.seo?.opengraphImage?.sourceUrl || value.featuredImage?.sourceUrl || DEFAULT_OG_IMAGE
    const section = SECTION[value.type]
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: section.name, item: `${SITE_URL}${section.path}` },
        { '@type': 'ListItem', position: 3, name: value.title, item: url },
      ],
    }

    return {
      link: value.featuredImage
        ? [{ rel: 'preload', as: 'image' as const, href: value.featuredImage.sourceUrl, fetchpriority: 'high' as const }]
        : [],
      script: [
        { type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumb) },
        { type: 'application/ld+json', innerHTML: JSON.stringify(mainEntity(value, url, image)) },
      ],
    }
  })

  useSeoMeta({
    title: () => page.value?.seo?.title || page.value?.title || '',
    titleTemplate: null,
    description: () => page.value?.seo?.metaDesc || '',
    ogTitle: () => page.value?.seo?.opengraphTitle || page.value?.seo?.title || page.value?.title || '',
    ogDescription: () => page.value?.seo?.opengraphDescription || page.value?.seo?.metaDesc || '',
    ogImage: () => page.value?.seo?.opengraphImage?.sourceUrl || page.value?.featuredImage?.sourceUrl || DEFAULT_OG_IMAGE,
    ogType: 'article',
    ogUrl: () => canonicalUrl(route.path),
    twitterTitle: () => page.value?.seo?.title || page.value?.title || '',
    twitterDescription: () => page.value?.seo?.metaDesc || '',
    twitterImage: () => page.value?.seo?.opengraphImage?.sourceUrl || page.value?.featuredImage?.sourceUrl || DEFAULT_OG_IMAGE,
  })
}
