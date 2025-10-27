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
            <h2 class="text-xl font-bold text-blu mb-4">Synchronization Status</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Connection Status -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <h3 class="font-semibold text-gray-700 mb-3">Connection Status</h3>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span>WordPress:</span>
                    <div class="flex items-center">
                      <div 
                        :class="[
                          'w-2 h-2 rounded-full mr-2',
                          wordpressStatus === 'Ready' ? 'bg-green-500' : 'bg-red-500'
                        ]"
                      ></div>
                      <span>{{ wordpressStatus }}</span>
                    </div>
                  </div>
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
                </div>
              </div>

              <!-- Terms Count -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <h3 class="font-semibold text-gray-700 mb-3">Terms Count</h3>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span>WordPress:</span>
                    <span class="font-medium">{{ wordpressTermCount }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Algolia:</span>
                    <span class="font-medium">{{ algoliaTermCount }}</span>
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
              :disabled="!isReady || isUpdating || !canUpdate"
            >
              <span v-if="!isReady">Initializing...</span>
              <span v-else-if="isUpdating">Updating {{ updateProgress }}%...</span>
              <span v-else-if="!canUpdate">Please wait {{ cooldownMinutes }} minutes before next update</span>
              <span v-else>Update Glossary Terms Index</span>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import gql from 'graphql-tag'

// Constants
const UPDATE_COOLDOWN = 5 * 60 * 1000 // 5 minutes

// Auth state
const isAuthenticated = ref(false)
const accessPassword = ref('')
const accessError = ref('')
let sessionCheckInterval

// System state
const algoliaStatus = ref('Not Connected')
const wordpressStatus = ref('Not Connected')
const terms = ref([])
const wordpressTermCount = ref(0)
const algoliaTermCount = ref(0)
const isUpdating = ref(false)
const updateProgress = ref(0)
const updateSuccess = ref(false)
const statusMessage = ref('')
const lastUpdateTime = ref(null)

// Get Nuxt app instance

// GraphQL query for glossary terms
const GLOSSARY_TERMS_QUERY = gql`
  query FetchGlossaryTerms {
    glossaryTerms(first: 1000) {
      nodes {
        slug
        title
        plurale
        excerpt
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`

// Fetch Algolia count using REST API
async function fetchAlgoliaCount() {
  try {
    const response = await fetch('/api/algolia/count', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch Algolia count')
    }

    const data = await response.json()
    algoliaTermCount.value = data.count
    algoliaStatus.value = 'Ready'
    console.log('Algolia glossary terms count:', data.count)
    return data.count
  } catch (error) {
    console.error('Error fetching Algolia count:', error)
    algoliaStatus.value = 'Failed'
    algoliaTermCount.value = 0
    return 0
  }
}

async function fetchWordPressTerms() {
  const nuxtApp = useNuxtApp()
  if (!nuxtApp.$apolloClient) {
    console.error('WordPress connection not available')
    return
  }

  try {
    const { data } = await nuxtApp.$apolloClient.query({
      query: GLOSSARY_TERMS_QUERY
    })

    if (data?.glossaryTerms?.nodes) {
      terms.value = data.glossaryTerms.nodes.map(term => ({
        objectID: term.slug,
        title: term.title,
        excerpt: term.excerpt || '',
        plurale: term.plurale || '',
        imageUrl: term.featuredImage?.node?.sourceUrl || '',
        imageAlt: term.featuredImage?.node?.altText || '',
        contentType: 'glossary'
      }))
      wordpressTermCount.value = terms.value.length
      statusMessage.value = `Loaded ${terms.value.length} glossary terms from WordPress`
      wordpressStatus.value = 'Ready'
    }
  } catch (error) {
    console.error('Error fetching WordPress terms:', error)
    statusMessage.value = 'Failed to fetch terms from WordPress'
    wordpressStatus.value = 'Failed'
  }
}

async function initialize() {
  if (process.server) return

  try {
    // Initialize Algolia
    await fetchAlgoliaCount()
  } catch (error) {
    console.error('Algolia initialization error:', error)
    algoliaStatus.value = 'Failed'
  }

  // Fetch WordPress terms
  await fetchWordPressTerms()
}

async function updateAlgoliaIndex() {
  if (!isReady.value || !canUpdate.value) return

  try {
    isUpdating.value = true
    updateProgress.value = 0
    statusMessage.value = 'Starting update...'

    const totalTerms = terms.value.length
    
    // Send data to server API to handle Algolia update
    const response = await fetch('/api/algolia/update-glossary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: accessPassword.value,
        terms: terms.value
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
    statusMessage.value = result.message || `Successfully updated ${totalTerms} glossary terms`
    lastUpdateTime.value = Date.now()
    localStorage.setItem('last_algolia_glossary_update', lastUpdateTime.value.toString())
    
    console.log('Update result:', result)
  } catch (error) {
    console.error('Error updating Algolia index:', error)
    updateSuccess.value = false
    statusMessage.value = `Failed to update index: ${error.message}`
  } finally {
    isUpdating.value = false
  }
}

// Authentication function
function verifyAccess() {
  if (!accessPassword.value) {
    accessError.value = 'Please enter a password'
    return
  }
  
  // Password will be verified by server when updating
  // For now, allow access to UI
  isAuthenticated.value = true
  accessError.value = ''
  sessionStorage.setItem('algolia_glossary_auth', 'true')
  sessionStorage.setItem('algolia_glossary_session_time', Date.now().toString())
  initialize()
}

// Computed properties
const isReady = computed(() => {
  return algoliaStatus.value === 'Ready' && 
         wordpressStatus.value === 'Ready' && 
         terms.value.length > 0
})

const countDifference = computed(() => {
  return wordpressTermCount.value - algoliaTermCount.value
})

const canUpdate = computed(() => {
  if (!lastUpdateTime.value) return true
  return Date.now() - lastUpdateTime.value >= UPDATE_COOLDOWN
})

const cooldownMinutes = computed(() => {
  if (!lastUpdateTime.value) return 0
  const remainingTime = UPDATE_COOLDOWN - (Date.now() - lastUpdateTime.value)
  return Math.ceil(remainingTime / 60000)
})

const getCountDifferenceMessage = computed(() => {
  if (countDifference.value > 0) {
    return `${countDifference.value} glossary terms need to be synchronized`
  }
  return 'All terms are synchronized'
})

// Watch for authentication changes
watch(isAuthenticated, (newValue) => {
  if (!newValue) {
    algoliaStatus.value = 'Not Connected'
    wordpressStatus.value = 'Not Connected'
    terms.value = []
    wordpressTermCount.value = 0
    algoliaTermCount.value = 0
    statusMessage.value = ''
  }
})

// Lifecycle hooks
onMounted(() => {
  if (process.client) {
    isAuthenticated.value = sessionStorage.getItem('algolia_glossary_auth') === 'true'
    
    const storedTime = localStorage.getItem('last_algolia_glossary_update')
    if (storedTime) {
      lastUpdateTime.value = parseInt(storedTime)
    }
    
    const lastSession = sessionStorage.getItem('algolia_glossary_session_time')
    if (lastSession) {
      const sessionAge = Date.now() - parseInt(lastSession)
      if (sessionAge > 30 * 60 * 1000) {
        sessionStorage.clear()
        isAuthenticated.value = false
      }
    }

    sessionCheckInterval = setInterval(() => {
      const lastSession = sessionStorage.getItem('algolia_glossary_session_time')
      if (lastSession) {
        const sessionAge = Date.now() - parseInt(lastSession)
        if (sessionAge > 30 * 60 * 1000) {
          isAuthenticated.value = false
          sessionStorage.clear()
        }
      }
    }, 60000)

    if (isAuthenticated.value) {
      initialize()
    }
  }
})

onUnmounted(() => {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval)
  }
})

definePageMeta({
  ssr: false,
  robots: 'noindex, nofollow'
})
</script>