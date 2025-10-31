<template>
  <div class="min-h-screen bg-gray-100 py-12">
    <div class="max-w-4xl mx-auto px-4">
      <ClientOnly>
        <!-- Access Check -->
        <div v-if="!isAuthenticated" class="bg-white rounded-lg shadow-lg p-6 mb-6 mt-24">
          <h2 class="text-xl font-bold text-blu mb-4">Authentication Required</h2>
          <div class="space-y-4">
            <input 
              type="password" 
              v-model="accessPassword"
              placeholder="Enter access password"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blu"
              @keyup.enter="verifyAccess"
            />
            <div v-if="accessError" class="text-red-500 text-sm">{{ accessError }}</div>
            <button 
              @click="verifyAccess"
              class="w-full bg-blu hover:bg-celeste text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Verify Access
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <template v-else>
          <!-- Connection Status -->
          <div class="bg-white rounded-lg shadow-lg p-6 mb-6 mt-24">
            <h2 class="text-xl font-bold text-blu mb-4">Algolia Blog Posts Status</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Client Status -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <h3 class="font-semibold text-gray-700 mb-3">Connection Status</h3>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span>Algolia:</span>
                    <div class="flex items-center">
                      <div 
                        :class="[
                          'w-2 h-2 rounded-full mr-2',
                          algoliaStatus === 'Ready' ? 'bg-green-500' : 'bg-red-500'
                        ]"
                      ></div>
                      <span>{{ algoliaStatus }}</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>WordPress:</span>
                    <div class="flex items-center">
                      <div 
                        :class="[
                          'w-2 h-2 rounded-full mr-2',
                          apolloStatus === 'Ready' ? 'bg-green-500' : 'bg-red-500'
                        ]"
                      ></div>
                      <span>{{ apolloStatus }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Posts Count -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <h3 class="font-semibold text-gray-700 mb-3">Posts Count</h3>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span>WordPress:</span>
                    <span class="font-medium">{{ wordpressPostCount }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Algolia:</span>
                    <span class="font-medium">{{ algoliaPostCount }}</span>
                  </div>
                  <div v-if="countDifference !== 0" 
                       class="text-xs mt-1 p-2 rounded"
                       :class="countDifference > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'"
                  >
                    {{ getCountDifferenceMessage }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Update Controls -->
          <div class="bg-white rounded-lg shadow-lg p-6">
            <button
              @click="updateAlgoliaIndex"
              class="w-full bg-blu hover:bg-celeste text-white font-bold py-4 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!isReady || isUpdating"
            >
              <span v-if="!isReady">Initializing...</span>
              <span v-else-if="isUpdating">Updating {{ updateProgress }}%...</span>
              <span v-else>Update Blog Posts Index</span>
            </button>

            <!-- Progress Bar -->
            <div v-if="isUpdating" class="mt-4">
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blu h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${updateProgress}%` }"
                ></div>
              </div>
            </div>

            <!-- Status Message -->
            <div
              v-if="statusMessage"
              class="mt-4 p-4 rounded-lg"
              :class="{
                'bg-green-50 text-green-800': updateSuccess,
                'bg-red-50 text-red-800': !updateSuccess
              }"
            >
              {{ statusMessage }}
            </div>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGraphQL } from '~/composables/useGraphQL'

// State
const algoliaStatus = ref('Not Connected')
const apolloStatus = ref('Not Connected')
const posts = ref([])
const wordpressPostCount = ref(0)
const algoliaPostCount = ref(0)
const isUpdating = ref(false)
const updateProgress = ref(0)
const updateSuccess = ref(false)
const statusMessage = ref('')
const accessPassword = ref('')
const accessError = ref('')
const isAuthenticated = ref(false)

// Get GraphQL composable
const { query } = useGraphQL()

// Computed
const isReady = computed(() => {
  return algoliaStatus.value === 'Ready' && 
         apolloStatus.value === 'Ready' && 
         posts.value.length > 0
})

const countDifference = computed(() => {
  return wordpressPostCount.value - algoliaPostCount.value
})

const getCountDifferenceMessage = computed(() => {
  if (countDifference.value > 0) {
    return `${countDifference.value} blog posts need to be synchronized`
  }
  return 'All posts are synchronized'
})

// Fetch Algolia count using server API
async function fetchAlgoliaCount() {
  try {
    const response = await fetch('/api/algolia/count')
    
    if (!response.ok) {
      console.error('Failed to fetch Algolia count')
      algoliaPostCount.value = 0
      algoliaStatus.value = 'Ready'
      return
    }

    const data = await response.json()
    algoliaPostCount.value = data.count || 0
    algoliaStatus.value = 'Ready'
    
    console.log('Algolia count fetched successfully:', algoliaPostCount.value)
  } catch (error) {
    console.error('Error fetching Algolia count:', error)
    algoliaStatus.value = 'Error'
  }
}

// GraphQL query
const BLOG_POSTS_QUERY = `
  query FetchBlogPosts {
    blogPosts(first: 1000) {
      nodes {
        slug
        title
        authorName
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        excerpt
      }
    }
  }
`

// Fetch posts from WordPress
async function fetchWordPressPosts() {
  try {
    const data = await query(BLOG_POSTS_QUERY)

    if (data?.blogPosts?.nodes) {
      posts.value = data.blogPosts.nodes.map(post => ({
        objectID: post.slug,
        title: post.title || '',
        authorName: post.authorName || '',
        date: post.date || '',
        imageUrl: post.featuredImage?.node?.sourceUrl || '',
        imageAlt: post.featuredImage?.node?.altText || '',
        excerpt: post.excerpt || '',
        contentType: 'blog'
      }))
      wordpressPostCount.value = posts.value.length
      statusMessage.value = `Loaded ${posts.value.length} blog posts from WordPress`
      apolloStatus.value = 'Ready'
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    statusMessage.value = 'Failed to fetch blog posts'
    apolloStatus.value = 'Failed'
  }
}

// Initialize
async function initialize() {
  if (process.server) return

  try {
    // Initialize Algolia
    await fetchAlgoliaCount()
  } catch (error) {
    console.error('Algolia initialization error:', error)
    algoliaStatus.value = 'Ready'
    algoliaPostCount.value = 0
  }

  // Fetch WordPress posts
  await fetchWordPressPosts()
}

// Update Algolia index using server API
async function updateAlgoliaIndex() {
  if (!isReady.value) return

  try {
    isUpdating.value = true
    updateProgress.value = 0
    statusMessage.value = 'Starting update...'

    const totalPosts = posts.value.length
    
    // Send data to server API to handle Algolia update
    const response = await fetch('/api/algolia/update-blog-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: accessPassword.value,
        posts: posts.value
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.statusMessage || 'Failed to update Algolia index')
    }

    const result = await response.json()
    
    updateProgress.value = 100
    await fetchAlgoliaCount()
    updateSuccess.value = true
    statusMessage.value = result.message || `Successfully updated ${totalPosts} blog posts`
    
    console.log('Update result:', result)
  } catch (error) {
    console.error('Error updating Algolia index:', error)
    updateSuccess.value = false
    statusMessage.value = `Failed to update index: ${error.message}`
  } finally {
    isUpdating.value = false
  }
}

// Verify access
async function verifyAccess() {
  try {
    if (!accessPassword.value) {
      accessError.value = 'Please enter a password'
      return
    }
    
    // Password will be verified by server when updating
    // For now, allow access to UI
    isAuthenticated.value = true
    accessError.value = ''
  } catch (error) {
    console.error('Error verifying access:', error)
    accessError.value = 'Invalid access password'
  }
}

// Initialize on mount
onMounted(() => {
  if (process.client) {
    initialize()
  }
})

// Meta
definePageMeta({
  ssr: false,
  robots: 'noindex, nofollow'
})
</script>