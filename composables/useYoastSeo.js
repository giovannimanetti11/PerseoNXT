import { useHead } from '#app'
import { computed } from 'vue'

export function useYoastSeo(yoastData) {
  const metaTitle = computed(() => yoastData.value?.title || '')
  const metaDescription = computed(() => yoastData.value?.metaDesc || '')
  const ogTitle = computed(() => yoastData.value?.opengraphTitle || metaTitle.value)
  const ogDescription = computed(() => yoastData.value?.opengraphDescription || metaDescription.value)
  const ogImage = computed(() => yoastData.value?.opengraphImage?.sourceUrl || '/media/og-image.jpg')
  const publishedTime = computed(() => yoastData.value?.publishedTime || '')
  const modifiedTime = computed(() => yoastData.value?.modifiedTime || '')

  useHead({
    title: metaTitle,
    meta: [
      { name: 'description', content: metaDescription },
      { property: 'og:title', content: ogTitle },
      { property: 'og:description', content: ogDescription },
      { property: 'og:image', content: ogImage },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: ogTitle },
      { name: 'twitter:description', content: ogDescription },
      { name: 'twitter:image', content: ogImage },
      { name: 'article:published_time', content: publishedTime },
      { name: 'article:modified_time', content: modifiedTime }
    ]
  })
}