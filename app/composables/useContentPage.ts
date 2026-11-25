import type { BlogPage, ContentType, GlossaryPage, PlantPage } from '#shared/types/content'

interface PageByType {
  plant: PlantPage
  glossary: GlossaryPage
  blog: BlogPage
}

/**
 * Loads a monograph, glossary term or blog post from /api/content and turns a
 * failed request into the error page: 404 when WordPress has no such slug,
 * the upstream status (502/503) otherwise, so crawlers retry instead of
 * dropping the URL.
 */
export async function useContentPage<T extends ContentType>(type: T) {
  const route = useRoute()
  const slug = computed(() => String(route.params.slug ?? ''))

  const request = useFetch<PageByType[T]>(() => `/api/content/${type}/${encodeURIComponent(slug.value)}`, {
    key: computed(() => `content-${type}-${slug.value}`),
  })
  // Composables must run before the first await of the setup function.
  useContentHead(request.data)

  const { data, error } = await request
  if (error.value || !data.value) {
    const status = error.value?.statusCode ?? 404
    throw createError({
      statusCode: status,
      statusMessage: status === 404 ? 'Pagina non trovata' : 'Contenuto temporaneamente non disponibile',
      fatal: true,
    })
  }
  return data as Ref<PageByType[T]>
}
