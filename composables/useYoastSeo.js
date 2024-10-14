import { computed } from 'vue'
import { useHead } from '#app'

export function useYoastSeo(yoastData) {
  const metaTitle = computed(() => yoastData.value?.title || '')
  const metaDescription = computed(() => yoastData.value?.metaDesc || '')
  const ogTitle = computed(() => yoastData.value?.opengraphTitle || metaTitle.value)
  const ogDescription = computed(() => yoastData.value?.opengraphDescription || metaDescription.value)
  const ogImage = computed(() => yoastData.value?.image || '')
  const ogUrl = computed(() => yoastData.value?.url || '')
  const ogType = computed(() => yoastData.value?.type || 'website')
  const ogSiteName = computed(() => yoastData.value?.siteName || '')
  const keywords = computed(() => yoastData.value?.keywords || '')
  const publishedTime = computed(() => yoastData.value?.publishedTime || '')
  const modifiedTime = computed(() => yoastData.value?.modifiedTime || '')
  const author = computed(() => yoastData.value?.author || '')

  useHead({
    title: metaTitle,
    meta: [
      { name: 'description', content: metaDescription },
      { name: 'keywords', content: keywords },
      { property: 'og:title', content: ogTitle },
      { property: 'og:description', content: ogDescription },
      { property: 'og:image', content: ogImage },
      { property: 'og:url', content: ogUrl },
      { property: 'og:type', content: ogType },
      { property: 'og:site_name', content: ogSiteName },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: ogTitle },
      { name: 'twitter:description', content: ogDescription },
      { name: 'twitter:image', content: ogImage },
      { name: 'article:published_time', content: publishedTime },
      { name: 'article:modified_time', content: modifiedTime },
      { name: 'article:author', content: author },
    ],
    link: [
      { rel: 'canonical', href: ogUrl },
    ],
  })
}