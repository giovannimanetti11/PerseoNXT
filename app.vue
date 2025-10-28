<template>
  <div :class="['app-loading', { 'app-loaded': isLoaded }]">
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useHead, useSeoMeta, useNuxtApp } from '#app'
import gql from 'graphql-tag'


// GraphQL queries
const GET_POST_SEO_DATA = gql`
  query GetPostWithSEO($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      title
      slug
      seo {
        title
        metaDesc
        opengraphTitle
        opengraphDescription
        opengraphImage {
          sourceUrl
        }
      }
      content
      date
      modified
      author {
        node {
          name
        }
      }
    }
  }
`

const GET_PAGE_SEO_DATA = gql`
  query GetPageWithSEO($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      slug
      seo {
        title
        metaDesc
        opengraphTitle
        opengraphDescription
        opengraphImage {
          sourceUrl
        }
      }
    }
  }
`

// State and setup
const route = useRoute()
const nuxtApp = useNuxtApp()
const isLoaded = ref(false)
const baseUrl = 'https://wikiherbalist.com'

// Static titles mapping
const staticTitles: Record<string, string> = {
  'disclaimer': 'Disclaimer',
  'privacy-policy': 'Privacy Policy',
  'cookie-policy': 'Cookie Policy'
}

const isHomepage = computed(() => route.path === '/')

const isPost = computed(() => {
  const routeName = route.name as string
  return !['about', 'index'].includes(routeName) && route.path !== '/'
})

// Async data fetching with useAsyncData
const { data: seoData } = useAsyncData(
  'seoData',
  async () => {
    const routeName = route.name as string
    
    if (!nuxtApp.$apolloClient) {
      console.error('Apollo client not available')
      return null
    }

    try {
      if (routeName === 'index' || route.path === '/') {
        try {
          const { data } = await nuxtApp.$apolloClient.query({
            query: GET_PAGE_SEO_DATA,
            variables: { uri: '/' }
          })
          return data.page || {
            title: 'Wikiherbalist - Enciclopedia di erbe aromatiche e medicinali',
            seo: {
              title: 'Wikiherbalist - Enciclopedia di erbe aromatiche e medicinali',
              metaDesc: 'Scopri proprietà, usi e benefici delle piante medicinali attraverso monografie dettagliate, glossario e articoli informativi.'
            }
          }
        } catch (error) {
          console.error('Error fetching homepage data:', error)
          return {
            title: 'Wikiherbalist - Enciclopedia di erbe aromatiche e medicinali',
            seo: {
              title: 'Wikiherbalist - Enciclopedia di erbe aromatiche e medicinali',
              metaDesc: 'Scopri proprietà, usi e benefici delle piante medicinali attraverso monografie dettagliate, glossario e articoli informativi.'
            }
          }
        }
      } 
      
      if (staticTitles[routeName]) {
        return {
          seo: {
            title: staticTitles[routeName],
            metaDesc: 'Enciclopedia online di erbe aromatiche e medicinali'
          }
        }
      }

      const slug = isPost.value 
        ? (Array.isArray(route.params.uri) ? route.params.uri[0] : route.path.split('/').pop())
        : route.path

      const { data } = await nuxtApp.$apolloClient.query({
        query: isPost.value ? GET_POST_SEO_DATA : GET_PAGE_SEO_DATA,
        variables: { slug: isPost.value ? slug : slug || '/' }
      })

      // Check if data exists before accessing nested properties
      if (!data) {
        console.warn('GraphQL returned no data for route:', route.path)
        return null
      }

      return isPost.value ? data.post : data.page
    } catch (error) {
      console.error('GraphQL query error:', error)
      return null
    }
  },
  {
    watch: [() => route.fullPath],
    server: true,
    lazy: false
  }
)

// Watch for SEO data changes and update meta tags
watch(seoData, (newData) => {
  if (!newData) return

  const seo = newData.seo || {}
  const title = isHomepage.value ? (seo.title || 'Wikiherbalist') : (seo.title || 'Pagina')
  const metaDescription = seo.metaDesc || 'Enciclopedia online di erbe aromatiche e medicinali'
  const canonicalUrl = new URL(route.path, baseUrl).toString()

  // Remove trailing slash except for homepage
  const normalizedCanonical = canonicalUrl === baseUrl ? canonicalUrl : canonicalUrl.replace(/\/$/, '')

  // Update head meta tags
  useHead({
    titleTemplate: (titleChunk) => {
      if (isHomepage.value) {
        return titleChunk
      }
      return titleChunk ? `${titleChunk} | Wikiherbalist` : 'Wikiherbalist'
    },
    title,
    link: [
      { rel: 'canonical', href: normalizedCanonical },
    ],
  })

  // Update SEO meta tags
  useSeoMeta({
    title,
    ogTitle: seo.opengraphTitle || title,
    description: metaDescription,
    ogDescription: seo.opengraphDescription || metaDescription,
    ogUrl: normalizedCanonical,
    ogImage: seo.opengraphImage?.sourceUrl || `${baseUrl}/media/og-image.jpg`,
    ogType: isPost.value ? 'article' : 'website',
    ogLocale: 'it_IT',
    twitterCard: 'summary_large_image',
    articleModifiedTime: newData.modified,
    articlePublishedTime: newData.date,
    twitterTitle: seo.opengraphTitle || title,
    twitterDescription: seo.opengraphDescription || metaDescription,
    twitterImage: seo.opengraphImage?.sourceUrl || `${baseUrl}/media/og-image.jpg`
  })
}, { immediate: true })

// Lifecycle hooks
onMounted(() => {
  nextTick(() => {
    isLoaded.value = true
  })
})
</script>

<style>
.app-loading {
  opacity: 0;
  transition: opacity 0.3s ease-in;
}

.app-loaded {
  opacity: 1;
}

.debug-info {
  position: fixed;
  bottom: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px;
  font-size: 12px;
  z-index: 9999;
}
</style>