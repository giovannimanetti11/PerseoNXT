<template>
  <div class="relative w-5/6 mx-auto -my-4" ref="searchContainerRef">
    <div class="w-full sm:w-4/5 md:w-3/5 mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
      <!-- Search input field -->
      <div 
        :class="[
          'flex items-center h-12 md:h-14',
          'border-2 border-celeste rounded-2xl overflow-hidden',
          {'rounded-b-none border-b-0': isActive && (searchResults.length > 0 || isSearching || (searchMade && searchResults.length === 0))},
          'focus-within:ring-2 focus-within:ring-celeste focus-within:ring-opacity-50'
        ]"
      >
        <Icon name="heroicons:magnifying-glass-16-solid" class="ml-2 sm:ml-5 text-celeste text-xl sm:text-2xl flex-shrink-0" />
        <input
          type="text"
          placeholder="Cerca in Wikiherbalist"
          class="w-full py-2 px-2 sm:px-4 text-sm sm:text-base text-gray-700 leading-tight focus:outline-none"
          v-model="searchTerm"
          @input="handleInput"
          @focus="setActive(true)"
          @keydown.enter="performSearch"
        />
        <div v-if="searchTerm" @click.stop="resetSearch" class="mr-2 sm:mr-4 hover:cursor-pointer flex-shrink-0">
          <Icon name="ic:baseline-close" class="text-xl sm:text-2xl text-celeste" />
        </div>
      </div>

      <!-- Search results -->
      <div v-if="isActive && (searchResults.length || (searchMade && !searchResults.length))" 
        class="bg-gray-50 border-2 border-t-0 border-celeste overflow-hidden w-full"
        :class="{'rounded-b-2xl': !isSearching}"
      >
        <div class="px-2 sm:px-4">
          <!-- Loading indicator -->
          <div v-if="isSearching" class="flex justify-center items-center p-4">
            <Icon name="eos-icons:three-dots-loading" class="text-4xl text-celeste" />
          </div>

          <div v-else-if="searchResults.length" class="max-h-[60vh] overflow-y-auto scrollbar-hide">
            <div v-for="result in paginatedResults" :key="result.objectID" 
                 class="flex items-center py-2 hover:bg-gray-100 hover:cursor-pointer w-full" 
                 @click.stop="goToPost(result.objectID, result.contentType)">
              <NuxtImg 
                :src="result.imageUrl" 
                :alt="result.imageAlt" 
                class="rounded-lg w-16 h-16 sm:w-20 sm:h-20 max-w-[64px] max-h-[64px] sm:max-w-[80px] sm:max-h-[80px] object-cover mr-2 sm:mr-4 flex-shrink-0" 
              />
              <div class="flex-grow min-w-0">
                <h3 class="text-sm sm:text-lg font-bold truncate" v-html="highlightMatch(result._highlightResult.title.value)"></h3>
                <p v-if="result.contentType === 'plant'" class="text-xs sm:text-sm italic truncate" v-html="highlightMatch(result._highlightResult.nomeScientifico.value)"></p>
                <p v-if="result.contentType === 'blog'" class="text-xs sm:text-sm text-gray-600 truncate">Di: {{ result.authorName }}</p>
              </div>
              <!-- Content type icon -->
              <div class="flex-shrink-0 ml-1 sm:ml-2">
                <div 
                  @mouseenter="showTooltip(result.contentType, result.objectID)" 
                  @mouseleave="hideTooltip"
                  class="cursor-help"
                  :data-id="result.objectID"
                >
                  <Icon v-if="result.contentType === 'plant'" name="mdi:flower" class="text-xl sm:text-2xl text-verde" />
                  <Icon v-else-if="result.contentType === 'blog'" name="mdi:post" class="text-xl sm:text-2xl text-blu" />
                  <Icon v-else-if="result.contentType === 'glossary'" name="mdi:book-open-page-variant" class="text-xl sm:text-2xl text-celeste" />
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex justify-center items-center py-4">
            <button 
              @click.stop="prevPage" 
              :disabled="currentPage === 1"
              class="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-ghiaccio text-blu hover:bg-celeste hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed mr-1 sm:mr-2"
              aria-label="Pagina precedente"
            >
              <Icon name="mdi:chevron-left" class="text-xl sm:text-2xl" />
            </button>

            <div class="flex items-center">
              <button 
                v-for="page in visiblePages" 
                :key="page" 
                @click.stop="goToPage(page)"
                :class="[
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-1 text-xs sm:text-sm font-medium transition-colors duration-300',
                  page === '...' ? 'cursor-default' : '',
                  currentPage === page ? 'bg-blu text-white' : 'bg-ghiaccio text-blu hover:bg-celeste hover:text-white'
                ]"
              >
                {{ page }}
              </button>
            </div>

            <button 
              @click.stop="nextPage" 
              :disabled="currentPage === totalPages"
              class="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-ghiaccio text-blu hover:bg-celeste hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ml-1 sm:ml-2"
              aria-label="Pagina successiva"
            >
              <Icon name="mdi:chevron-right" class="text-xl sm:text-2xl" />
            </button>
          </div>
        
          <!-- No results message -->
          <div v-if="searchMade && !searchResults.length" class="flex flex-col p-4 sm:p-10 w-auto m-auto">
            <p class="text-red-500 border border-red-500 rounded-lg p-2 text-xs sm:text-sm">
              Nessun risultato trovato. Prova con parole chiave diverse.
            </p>
            <p class="text-xs text-gray-600 mt-2">
              Non trovi la voce che cerchi? 
              <NuxtLink to="/#section-contacts" class="text-blu hover:text-celeste">
                Segnalacelo!
              </NuxtLink> 
              La inseriremo al più presto
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <div 
      v-if="tooltipVisible"
      class="fixed z-50 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm"
      :style="tooltipStyle"
    >
      {{ tooltipContent }}
      <div class="absolute w-2 h-2 bg-gray-900 rotate-45 -bottom-1 left-1/2 transform -translate-x-1/2"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDebounceFn } from '@vueuse/core';
import algoliasearch from 'algoliasearch/lite';
import { apiConfig } from '~/config.js';

const router = useRouter();
const algoliaClient = algoliasearch(apiConfig.algoliaAppId, apiConfig.algoliaSearchAPIKey);
const searchIndex = algoliaClient.initIndex('wikiherbalist');

// Reactive state
const isActive = ref(false);
const searchTerm = ref('');
const searchResults = ref([]);
const searchMade = ref(false);
const isSearching = ref(false);
const tooltipVisible = ref(false);
const tooltipContent = ref('');
const tooltipPosition = ref({ x: 0, y: 0 });
const activeTooltipId = ref(null);
const currentPage = ref(1);
const searchContainerRef = ref(null);

// Constants
const RESULTS_PER_PAGE = 5;

// Computed properties
const totalPages = computed(() => Math.ceil(searchResults.value.length / RESULTS_PER_PAGE));

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * RESULTS_PER_PAGE;
  const end = start + RESULTS_PER_PAGE;
  return searchResults.value.slice(start, end);
});

const visiblePages = computed(() => {
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= totalPages.value; i++) {
    if (i === 1 || i === totalPages.value || (i >= currentPage.value - delta && i <= currentPage.value + delta)) {
      range.push(i);
    }
  }

  range.forEach(i => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  });

  return rangeWithDots;
});

// Navigation functions
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function goToPage(page) {
  if (typeof page === 'number' && page !== currentPage.value) {
    currentPage.value = page;
  }
}

// Search functions
function handleInput() {
  if (!searchTerm.value.trim()) {
    resetSearch();
    return;
  }
  debouncedSearch();
}

function setActive(value) {
  if (value && !searchTerm.value.trim()) {
    return;
  }
  isActive.value = value;
}

async function performSearch() {
  isSearching.value = true;
  setActive(true);
  searchMade.value = false;
  currentPage.value = 1;
  try {
    const { hits } = await searchIndex.search(searchTerm.value, {
      attributesToRetrieve: ['title', 'nomeScientifico', 'authorName', 'imageUrl', 'imageAlt', 'contentType'],
      hitsPerPage: 1000,
      attributesToHighlight: ['title', 'nomeScientifico'],
      highlightPreTag: '<em>',
      highlightPostTag: '</em>',
      ignorePlurals: true,
      removeStopWords: true,
      typoTolerance: true,
    });
    searchResults.value = hits;
    searchMade.value = true;

    // Track search query in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'search', {
        search_term: searchTerm.value
      });
    }
  } catch (error) {
    console.error('Error performing search:', error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

// Tooltip functions
function getTooltipContent(contentType) {
  switch (contentType) {
    case 'plant':
      return 'Erba medicinale';
    case 'blog':
      return 'Blog post';
    case 'glossary':
      return 'Glossario';
    default:
      return '';
  }
}

function showTooltip(contentType, objectID) {
  tooltipContent.value = getTooltipContent(contentType);
  tooltipVisible.value = true;
  activeTooltipId.value = objectID;
  
  nextTick(() => {
    const iconElement = document.querySelector(`[data-id="${objectID}"]`);
    if (iconElement) {
      const rect = iconElement.getBoundingClientRect();
      tooltipPosition.value = {
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 10
      };
    }
  });
}

function hideTooltip() {
  tooltipVisible.value = false;
  activeTooltipId.value = null;
}

const tooltipStyle = computed(() => ({
  top: `${tooltipPosition.value.y}px`,
  left: `${tooltipPosition.value.x}px`,
  transform: 'translate(-50%, -100%)'
}));

// Utility functions
function highlightMatch(text) {
  return text.replace(/<em>/g, '<span class="bg-yellow-100 shadow-sm rounded">').replace(/<\/em>/g, '</span>');
}

const debouncedSearch = useDebounceFn(performSearch, 300);

function resetSearch() {
  searchTerm.value = '';
  searchResults.value = [];
  searchMade.value = false;
  isSearching.value = false;
  currentPage.value = 1;
  setActive(false);
}

function goToPost(objectID, contentType) {
  let path;
  switch (contentType) {
    case 'plant':
      path = `/${objectID}`;
      break;
    case 'blog':
      path = `/blog/${objectID}`;
      break;
    case 'glossary':
      path = `/glossario/${objectID}`;
      break;
    default:
      console.error('Unknown content type:', contentType);
      return;
  }
  router.push(path);
}

// Close search results when clicking outside
function handleClickOutside(event) {
  const container = searchContainerRef.value;
  const input = container.querySelector('input[type="text"]');
  const resultsContainer = container.querySelector('.bg-gray-50');
  
  if (isActive.value && !input.contains(event.target) && (!resultsContainer || !resultsContainer.contains(event.target))) {
    setActive(false);
  }
}

// Lifecycle hooks
onMounted(() => {
  if (process.client) {
    document.addEventListener('mousedown', handleClickOutside);
  }
});

onUnmounted(() => {
  if (process.client) {
    document.removeEventListener('mousedown', handleClickOutside);
  }
});
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>