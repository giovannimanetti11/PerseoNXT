<template>
  <div>
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useHead, useSeoMeta } from '#app'
import gql from 'graphql-tag'

const route = useRoute()
const nuxtApp = useNuxtApp()

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

// Function to fetch SEO data
const getSeoData = async (slug, isPost = true) => {
  if (!nuxtApp.$apolloClient) {
    console.error('Apollo client not available')
    return null
  }
  try {
    const { data } = await nuxtApp.$apolloClient.query({
      query: isPost ? GET_POST_SEO_DATA : GET_PAGE_SEO_DATA,
      variables: { slug: isPost ? slug : slug || '/' }
    })
    return isPost ? data.post : data.page
  } catch (error) {
    console.error('GraphQL query error:', error)
    return null
  }
}

// Reactive reference for SEO data
const seoData = ref(null)

// Static titles for specific pages
const staticTitles = {
  'disclaimer': 'Disclaimer',
  'privacy-policy': 'Privacy Policy',
  'cookie-policy': 'Cookie Policy'
}

// Computed property for canonical url
const canonicalUrl = computed(() => {
  const baseUrl = 'https://wikiherbalist.com'
  return route.path === '/' ? baseUrl : `${baseUrl}${route.path}`
})

// Computed property to check if is homepage
const isHomepage = computed(() => route.path === '/')

// Function to update SEO data
const updateSeoData = async () => {
  const routeName = route.name

  if (routeName === 'index') {
    // For the home page, fetch the SEO data from GraphQL
    seoData.value = await getSeoData('/', false)
  } else if (staticTitles[routeName]) {
    seoData.value = {
      seo: {
        title: staticTitles[routeName],
        metaDesc: 'Enciclopedia online di erbe aromatiche e medicinali'
      }
    }
  } else {
    const isPost = !['about'].includes(routeName)
    const slug = isPost 
      ? (Array.isArray(route.params.uri) ? route.params.uri[0] : route.path.split('/').pop())
      : route.path
    seoData.value = await getSeoData(slug, isPost)
  }
}

// Function to update head metadata
const updateHead = (data) => {
  const seo = data?.seo || {}
  const title = isHomepage.value ? (seo.title || 'Wikiherbalist') : (seo.title || 'Pagina')
  const metaDescription = seo.metaDesc || 'Enciclopedia online di erbe aromatiche e medicinali'
 
  useHead({
    titleTemplate: (titleChunk) => {
      if (isHomepage.value) {
        return titleChunk
      }
      return titleChunk ? `${titleChunk} | Wikiherbalist` : 'Wikiherbalist'
    },
    title: title,
    link: [
      { rel: 'canonical', href: canonicalUrl.value },
    ],
  })

  useSeoMeta({
    title: title,
    ogTitle: title,
    description: metaDescription,
    ogDescription: metaDescription,
    ogUrl: canonicalUrl.value,
    ogImage: '/media/og-image.jpg',
    twitterCard: 'summary_large_image',
  })
}

// Watch for changes in SEO data and update head
watch(seoData, (newData) => {
  updateHead(newData)
})

// Watch for route changes and update SEO data
watch(() => route.fullPath, () => {
  updateSeoData()
})

// Initialize SEO data on component mount
onMounted(() => {
  updateSeoData()
})
</script>

<style scoped>
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