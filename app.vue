<template>
  <div :class="['app-loading', { 'app-loaded': isLoaded }]">
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import { useRoute, useHead, useSeoMeta, useNuxtApp, useAsyncData } from '#app'
import gql from 'graphql-tag'

// Types
interface SeoData {
  seo?: {
    title?: string
    metaDesc?: string
  }
  title?: string
}

interface Author {
  node: {
    name: string
  }
}

interface PostData extends SeoData {
  id: string
  slug: string
  content: string
  date: string
  modified: string
  author: Author
}

interface PageData extends SeoData {
  id: string
  slug: string
}

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
      }
    }
  }
`

// State and setup
const route = useRoute()
const nuxtApp = useNuxtApp()
const isLoaded = ref(false)

// Static titles mapping
const staticTitles: Record<string, string> = {
  'disclaimer': 'Disclaimer',
  'privacy-policy': 'Privacy Policy',
  'cookie-policy': 'Cookie Policy'
}

// Computed properties
const canonicalUrl = computed(() => {
  const baseUrl = 'https://wikiherbalist.com'
  return route.path === '/' ? baseUrl : `${baseUrl}${route.path}`
})

const isHomepage = computed(() => route.path === '/')

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
      if (routeName === 'index') {
        const { data } = await nuxtApp.$apolloClient.query({
          query: GET_PAGE_SEO_DATA,
          variables: { uri: '/' }
        })
        return data.page
      } 
      
      if (staticTitles[routeName]) {
        return {
          seo: {
            title: staticTitles[routeName],
            metaDesc: 'Enciclopedia online di erbe aromatiche e medicinali'
          }
        }
      }

      const isPost = !['about'].includes(routeName)
      const slug = isPost 
        ? (Array.isArray(route.params.uri) ? route.params.uri[0] : route.path.split('/').pop())
        : route.path

      const { data } = await nuxtApp.$apolloClient.query({
        query: isPost ? GET_POST_SEO_DATA : GET_PAGE_SEO_DATA,
        variables: { slug: isPost ? slug : slug || '/' }
      })

      return isPost ? data.post : data.page
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

// Update head metadata when seoData changes
watch(seoData, (newData) => {
  if (!newData) return

  const seo = newData.seo || {}
  const title = isHomepage.value ? (seo.title || 'Wikiherbalist') : (seo.title || 'Pagina')
  const metaDescription = seo.metaDesc || 'Enciclopedia online di erbe aromatiche e medicinali'
 
  useHead({
    titleTemplate: (titleChunk) => {
      if (isHomepage.value) {
        return titleChunk
      }
      return titleChunk ? `${titleChunk} | Wikiherbalist` : 'Wikiherbalist'
    },
    title,
    link: [
      { rel: 'canonical', href: canonicalUrl.value },
    ],
  })

  useSeoMeta({
    title,
    ogTitle: title,
    description: metaDescription,
    ogDescription: metaDescription,
    ogUrl: canonicalUrl.value,
    ogImage: '/media/og-image.jpg',
    twitterCard: 'summary_large_image',
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