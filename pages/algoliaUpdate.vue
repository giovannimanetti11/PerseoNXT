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
              :disabled="!isReady || isUpdating || !canUpdate"
            >
              <span v-if="!isReady">Initializing...</span>
              <span v-else-if="isUpdating">Updating {{ updateProgress }}%...</span>
              <span v-else-if="!canUpdate">Please wait {{ cooldownMinutes }} minutes before next update</span>
              <span v-else>Update Posts Index</span>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useNuxtApp, useRuntimeConfig } from '#app';
import gql from 'graphql-tag';

// Constants
const UPDATE_COOLDOWN = 5 * 60 * 1000; // 5 minutes
const config = useRuntimeConfig();

// Ensure index name is defined
const ALGOLIA_INDEX_NAME = 'wikiherbalist';

console.log('Config:', {
  indexName: ALGOLIA_INDEX_NAME,
  applicationId: config.public.algolia?.applicationId
});

// Auth state
const isAuthenticated = ref(false);
const accessPassword = ref('');
const accessError = ref('');
let sessionCheckInterval;

// System state
const algoliaStatus = ref('Not Connected');
const wordpressStatus = ref('Not Connected');
const posts = ref([]);
const wordpressPostCount = ref(0);
const algoliaPostCount = ref(0);
const isUpdating = ref(false);
const updateProgress = ref(0);
const updateSuccess = ref(false);
const statusMessage = ref('');
const lastUpdateTime = ref(null);

// Get Nuxt Algolia instance
const nuxtApp = useNuxtApp();
const { $algolia } = nuxtApp;

// GraphQL query
const POSTS_QUERY = gql`
  query FetchPosts {
    posts(first: 1000) {
      nodes {
        slug
        title
        nomeScientifico
        authorName
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

// Initialize Algolia index
function getAlgoliaIndex() {
  if (!$algolia) {
    throw new Error('Algolia client not available');
  }

  return $algolia.initIndex(ALGOLIA_INDEX_NAME);
}

// Computed properties
const isReady = computed(() => {
  const readyState = {
    algoliaStatus: algoliaStatus.value,
    wordpressStatus: wordpressStatus.value,
    postsCount: posts.value.length
  };
  console.log('Ready state:', readyState);

  return algoliaStatus.value === 'Ready' && 
         wordpressStatus.value === 'Ready' && 
         posts.value.length > 0;
});

const countDifference = computed(() => {
  return wordpressPostCount.value - algoliaPostCount.value;
});

const canUpdate = computed(() => {
  if (!lastUpdateTime.value) return true;
  return Date.now() - lastUpdateTime.value >= UPDATE_COOLDOWN;
});

const cooldownMinutes = computed(() => {
  if (!lastUpdateTime.value) return 0;
  const remainingTime = UPDATE_COOLDOWN - (Date.now() - lastUpdateTime.value);
  return Math.ceil(remainingTime / 60000);
});

const getCountDifferenceMessage = computed(() => {
  if (countDifference.value > 0) {
    return `${countDifference.value} plant posts need to be synchronized`;
  }
  return 'All posts are synchronized';
});

// Authentication function
function verifyAccess() {
  if (accessPassword.value === 'your_access_password') {
    isAuthenticated.value = true;
    accessError.value = '';
    sessionStorage.setItem('algolia_auth', 'true');
    sessionStorage.setItem('algolia_session_time', Date.now().toString());
    initialize();
  } else {
    accessError.value = 'Invalid password';
  }
  accessPassword.value = '';
}

async function initialize() {
  if (process.server) return;

  try {
    console.log('Starting initialization with index:', ALGOLIA_INDEX_NAME);
    
    if (!$algolia) {
      throw new Error('Algolia client not initialized');
    }

    const index = getAlgoliaIndex();
    console.log('Index initialized');
    
    try {
      const { nbHits } = await index.search('', {
        filters: 'contentType:plant',
        attributesToRetrieve: []
      });
      
      algoliaPostCount.value = nbHits;
      algoliaStatus.value = 'Ready';
      console.log('Algolia connected successfully with', nbHits, 'posts');
    } catch (searchError) {
      if (searchError.status === 404) {
        console.log('Index does not exist yet - will be created on first update');
        algoliaStatus.value = 'Ready';
        algoliaPostCount.value = 0;
      } else {
        throw searchError;
      }
    }

    await fetchWordPressPosts();

  } catch (error) {
    console.error('Initialization failed:', error);
    algoliaStatus.value = 'Failed';
    statusMessage.value = `Initialization failed: ${error.message}`;
  }
}

async function fetchWordPressPosts() {
  if (!nuxtApp.$apolloClient) {
    throw new Error('WordPress connection not available');
  }

  try {
    const { data } = await nuxtApp.$apolloClient.query({
      query: POSTS_QUERY
    });

    if (!data?.posts?.nodes) {
      throw new Error('No posts data received');
    }

    posts.value = data.posts.nodes.map(post => ({
      objectID: post.slug,
      title: post.title || '',
      nomeScientifico: post.nomeScientifico || '',
      authorName: post.authorName || '',
      imageUrl: post.featuredImage?.node?.sourceUrl 
        ? `${post.featuredImage.node.sourceUrl}?w=160&h=160&fit=crop&format=webp&quality=80` 
        : '',
      imageAlt: post.featuredImage?.node?.altText || '',
      contentType: 'plant'
    }));

    wordpressPostCount.value = posts.value.length;
    wordpressStatus.value = 'Ready';
    console.log('WordPress ready with', posts.value.length, 'posts');

    return posts.value;
  } catch (error) {
    console.error('WordPress fetch failed:', error);
    wordpressStatus.value = 'Failed';
    throw error;
  }
}

async function updateAlgoliaIndex() {
  if (!isReady.value || !canUpdate.value) return;

  try {
    isUpdating.value = true;
    updateProgress.value = 0;
    statusMessage.value = 'Starting update...';

    const totalPosts = posts.value.length;
    
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
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.statusMessage || 'Failed to update Algolia index');
    }

    const result = await response.json();
    
    updateProgress.value = 100;
    
    // Verify final count
    try {
      const countResponse = await fetch('/api/algolia/count');
      if (countResponse.ok) {
        const data = await countResponse.json();
        algoliaPostCount.value = data.count;
        console.log('Final count:', data.count);
      }
    } catch (error) {
      console.error('Error verifying count:', error);
      // Continue as update might have succeeded
    }

    updateSuccess.value = true;
    statusMessage.value = result.message || `Successfully updated ${totalPosts} posts`;
    lastUpdateTime.value = Date.now();
    localStorage.setItem('last_algolia_update', lastUpdateTime.value.toString());
    
    console.log('Update result:', result);
  } catch (error) {
    console.error('Error updating Algolia index:', error);
    updateSuccess.value = false;
    statusMessage.value = `Failed to update index: ${error.message}`;
  } finally {
    isUpdating.value = false;
  }
}

// Watch for authentication changes
watch(isAuthenticated, (newValue) => {
  if (!newValue) {
    algoliaStatus.value = 'Not Connected';
    wordpressStatus.value = 'Not Connected';
    posts.value = [];
    wordpressPostCount.value = 0;
    algoliaPostCount.value = 0;
    statusMessage.value = '';
  }
});

// Lifecycle hooks
onMounted(() => {
  if (process.client) {
    isAuthenticated.value = sessionStorage.getItem('algolia_auth') === 'true';
    
    const storedTime = localStorage.getItem('last_algolia_update');
    if (storedTime) {
      lastUpdateTime.value = parseInt(storedTime);
    }
    
    const lastSession = sessionStorage.getItem('algolia_session_time');
    if (lastSession) {
      const sessionAge = Date.now() - parseInt(lastSession);
      if (sessionAge > 30 * 60 * 1000) {
        sessionStorage.clear();
        isAuthenticated.value = false;
      }
    }

    sessionCheckInterval = setInterval(() => {
      const lastSession = sessionStorage.getItem('algolia_session_time');
      if (lastSession) {
        const sessionAge = Date.now() - parseInt(lastSession);
        if (sessionAge > 30 * 60 * 1000) {
          isAuthenticated.value = false;
          sessionStorage.clear();
        }
      }
    }, 60000);

    if (isAuthenticated.value) {
      initialize();
    }
  }
});

onUnmounted(() => {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }
});

definePageMeta({
  ssr: false,
  robots: 'noindex, nofollow'
});
</script>