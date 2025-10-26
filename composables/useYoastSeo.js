import { useHead } from '#app'
import { computed, isRef } from 'vue'

export function useYoastSeo(yoastData) {
  // Support both ref and plain objects
  const getData = () => isRef(yoastData) ? yoastData.value : yoastData
  
  const metaTitle = computed(() => getData()?.title || '')
  const metaDescription = computed(() => getData()?.metaDesc || '')
  const ogTitle = computed(() => getData()?.opengraphTitle || metaTitle.value)
  const ogDescription = computed(() => getData()?.opengraphDescription || metaDescription.value)
  const ogImage = computed(() => getData()?.opengraphImage?.sourceUrl || '/media/og-image.jpg')
  const publishedTime = computed(() => getData()?.publishedTime || '')
  const modifiedTime = computed(() => getData()?.modifiedTime || '')

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