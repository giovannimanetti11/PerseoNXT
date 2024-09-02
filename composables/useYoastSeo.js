import { computed } from 'vue'
import { useHead, useRoute } from '#app'

export function useYoastSeo(yoastData) {
  const route = useRoute()

  const metaTitle = computed(() => yoastData.value?.title || '')
  const metaDescription = computed(() => yoastData.value?.metaDescription || '')
  const ogTitle = computed(() => yoastData.value?.ogTitle || metaTitle.value)
  const ogDescription = computed(() => yoastData.value?.ogDescription || metaDescription.value)
  const ogImage = computed(() => yoastData.value?.ogImage || '')

  useHead({
    title: metaTitle,
    meta: [
      { name: 'description', content: metaDescription },
      { property: 'og:title', content: ogTitle },
      { property: 'og:description', content: ogDescription },
      { property: 'og:image', content: ogImage },
      { property: 'og:url', content: computed(() => `https://wikiherbalist.com${route.path}`) },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    link: [
      { rel: 'canonical', href: computed(() => `https://wikiherbalist.com${route.path}`) },
    ],
  })
}