<template>
  <div>
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
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
  const isHomepage = route.name === 'index'
  const title = isHomepage ? (seo.title || 'Wikiherbalist') : (seo.title || 'Pagina')
  const metaDescription = seo.metaDesc || 'Enciclopedia online di erbe aromatiche e medicinali'
  
  useHead({
    titleTemplate: (titleChunk) => {
      if (isHomepage) {
        return titleChunk
      }
      return titleChunk ? `${titleChunk} | Wikiherbalist` : 'Wikiherbalist'
    },
    title: title,
    link: [
      { rel: 'canonical', href: `https://wikiherbalist.com${route.path}` },
    ],
  })

  useSeoMeta({
    title: title,
    ogTitle: title,
    description: metaDescription,
    ogDescription: metaDescription,
    ogUrl: `https://wikiherbalist.com${route.path}`,
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