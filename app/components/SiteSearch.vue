<template>
  <div ref="searchContainerRef" class="relative w-5/6 mx-auto -my-4">
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
        <label for="wiki-search" class="sr-only">Cerca in Wikiherbalist</label>
        <Icon name="heroicons:magnifying-glass-16-solid" class="ml-2 sm:ml-5 text-celeste text-xl sm:text-2xl flex-shrink-0" />
        <input
          id="wiki-search"
          v-model="searchTerm"
          type="text"
          placeholder="Cerca in Wikiherbalist"
          aria-label="Cerca in Wikiherbalist"
          class="w-full py-2 px-2 sm:px-4 text-sm sm:text-base text-gray-700 leading-tight focus:outline-none"
          @input="handleInput"
          @focus="handleInput"
          @keydown.enter="performSearch"
        >
        <button v-if="searchTerm" type="button" aria-label="Cancella la ricerca" class="mr-2 sm:mr-4 hover:cursor-pointer flex-shrink-0" @click.stop="resetSearch">
          <Icon name="ic:baseline-close" class="text-xl sm:text-2xl text-celeste" />
        </button>
      </div>

      <!-- Search results -->
      <div
        v-if="isActive && (searchResults.length || (searchMade && !searchResults.length))" 
        class="bg-gray-50 border-2 border-t-0 border-celeste overflow-hidden w-full"
        :class="{'rounded-b-2xl': !isSearching}"
      >
        <div class="px-2 sm:px-4">
          <!-- Loading indicator -->
          <div v-if="isSearching" class="flex justify-center items-center p-4">
            <Icon name="eos-icons:three-dots-loading" class="text-4xl text-celeste" />
          </div>

          <div v-else-if="searchResults.length" class="max-h-[60vh] overflow-y-auto scrollbar-hide">
            <div
              v-for="result in paginatedResults" :key="result.objectID" 
              class="flex items-center py-2 hover:bg-gray-100 hover:cursor-pointer w-full" 
              @click.stop="goToPost(result)"
            >
              <!-- Featured image -->
              <div class="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 mr-2 sm:mr-4">
                <div v-if="!result.imageLoaded" class="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blu"></div>
                </div>
                <img 
                  :src="result.imageUrl || '/media/default-og-image.jpg'" 
                  :alt="result.imageAlt || result.title" 
                  class="rounded-lg w-full h-full object-cover"
                  :class="{'opacity-0': !result.imageLoaded, 'opacity-100': result.imageLoaded}"
                  @load="result.imageLoaded = true"
                >
              </div>
              
              <!-- Content area -->
              <div class="flex-grow min-w-0">
                <h3 class="text-sm sm:text-lg font-bold truncate" v-html="highlightMatch(result._highlightResult?.title?.value || result.title)"></h3>
                <p v-if="result.contentType === 'plant'" class="text-xs sm:text-sm italic truncate" v-html="highlightMatch(result._highlightResult?.nomeScientifico?.value || result.nomeScientifico)"></p>
                <p v-if="result.contentType === 'blog'" class="text-xs sm:text-sm text-gray-600 truncate">Di: {{ result.authorName }}</p>
              </div>

              <!-- Type indicator -->
              <div class="flex-shrink-0 ml-1 sm:ml-2">
                <div 
                  class="cursor-help" 
                  :data-id="result.objectID"
                  @mouseenter="showTooltip(result.contentType, result.objectID)"
                  @mouseleave="hideTooltip"
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
              :disabled="currentPage === 1" 
              class="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-ghiaccio text-blu hover:bg-celeste hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed mr-1 sm:mr-2"
              aria-label="Pagina precedente"
              @click.stop="prevPage"
            >
              <Icon name="mdi:chevron-left" class="text-xl sm:text-2xl" />
            </button>

            <div class="flex items-center">
              <button 
                v-for="(page, index) in visiblePages" 
                :key="`${page}-${index}`" 
                :class="[
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-1 text-xs sm:text-sm font-medium transition-colors duration-300',
                  page === '...' ? 'cursor-default' : '',
                  currentPage === page ? 'bg-blu text-white' : 'bg-ghiaccio text-blu hover:bg-celeste hover:text-white'
                ]"
                @click.stop="goToPage(page)"
              >
                {{ page }}
              </button>
            </div>

            <button 
              :disabled="currentPage === totalPages" 
              class="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-ghiaccio text-blu hover:bg-celeste hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ml-1 sm:ml-2"
              aria-label="Pagina successiva"
              @click.stop="nextPage"
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

<script setup lang="ts">
import { onClickOutside, useDebounceFn } from '@vueuse/core'
import type { ContentType, SearchRecord } from '#shared/types/content'

type HighlightField = 'title' | 'nomeScientifico'

interface SearchResult extends SearchRecord {
  _highlightResult?: Partial<Record<HighlightField, { value: string }>>
  imageLoaded: boolean
}

const RESULTS_PER_PAGE = 5
const TYPE_LABELS: Record<ContentType, string> = {
  plant: 'Erba medicinale',
  blog: 'Blog post',
  glossary: 'Glossario',
}

const router = useRouter()
const { applicationId, searchApiKey, indexName } = useRuntimeConfig().public.algolia

const searchContainerRef = ref<HTMLElement | null>(null)
const isActive = ref(false)
const searchTerm = ref('')
const searchResults = ref<SearchResult[]>([])
const searchMade = ref(false)
const isSearching = ref(false)
const tooltipVisible = ref(false)
const tooltipContent = ref('')
const tooltipPosition = ref({ x: 0, y: 0 })
const currentPage = ref(1)
let requestId = 0

async function search(query: string): Promise<SearchResult[]> {
  const response = await $fetch<{ hits: SearchResult[] }>(`https://${applicationId}-dsn.algolia.net/1/indexes/${indexName}/query`, {
    method: 'POST',
    headers: { 'X-Algolia-API-Key': searchApiKey, 'X-Algolia-Application-Id': applicationId },
    body: {
      query,
      hitsPerPage: 1000,
      attributesToRetrieve: ['title', 'nomeScientifico', 'authorName', 'imageUrl', 'imageAlt', 'contentType', 'objectID'],
      attributesToHighlight: ['title', 'nomeScientifico'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    },
  })
  return response.hits.map((hit) => ({ ...hit, imageLoaded: false }))
}

const totalPages = computed(() => Math.ceil(searchResults.value.length / RESULTS_PER_PAGE))

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * RESULTS_PER_PAGE
  return searchResults.value.slice(start, start + RESULTS_PER_PAGE)
})

/** Page numbers around the current one, with "..." for the gaps. */
const visiblePages = computed(() => {
  const delta = 2
  const pages: (number | '...')[] = []
  let previous = 0
  for (let page = 1; page <= totalPages.value; page++) {
    if (page !== 1 && page !== totalPages.value && Math.abs(page - currentPage.value) > delta) continue
    if (previous) {
      if (page - previous === 2) pages.push(previous + 1)
      else if (page - previous > 2) pages.push('...')
    }
    pages.push(page)
    previous = page
  }
  return pages
})

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function goToPage(page: number | '...') {
  if (typeof page === 'number') currentPage.value = page
}

function setActive(value: boolean) {
  if (value && !searchTerm.value.trim()) return
  isActive.value = value
}

async function performSearch() {
  const query = searchTerm.value.trim()
  if (!query) {
    resetSearch()
    return
  }
  const id = ++requestId
  isSearching.value = true
  try {
    const results = await search(query)
    if (id !== requestId) return
    searchResults.value = results
    currentPage.value = 1
    searchMade.value = true
    setActive(true)
    window.gtag?.('event', 'search', { search_term: query })
  } catch (error) {
    if (id !== requestId) return
    console.error('[search]', error)
    searchResults.value = []
    searchMade.value = true
  } finally {
    if (id === requestId) isSearching.value = false
  }
}

const debouncedSearch = useDebounceFn(performSearch, 300)

function handleInput() {
  if (!searchTerm.value.trim()) {
    resetSearch()
    return
  }
  debouncedSearch()
}

function resetSearch() {
  requestId++
  searchTerm.value = ''
  searchResults.value = []
  searchMade.value = false
  isSearching.value = false
  currentPage.value = 1
  setActive(false)
}

function goToPost(result: SearchResult) {
  setActive(false)
  router.push(contentPath(result.contentType, result.objectID))
}

function showTooltip(contentType: ContentType, objectID: string) {
  tooltipContent.value = TYPE_LABELS[contentType]
  tooltipVisible.value = true
  nextTick(() => {
    const icon = searchContainerRef.value?.querySelector(`[data-id="${CSS.escape(objectID)}"]`)
    if (!icon) return
    const rect = icon.getBoundingClientRect()
    tooltipPosition.value = { x: rect.left + rect.width / 2, y: rect.top - 10 }
  })
}

function hideTooltip() {
  tooltipVisible.value = false
}

const tooltipStyle = computed(() => ({
  top: `${tooltipPosition.value.y}px`,
  left: `${tooltipPosition.value.x}px`,
  transform: 'translate(-50%, -100%)',
}))

/** Algolia highlight markup, reduced to <mark> by the sanitizer. */
function highlightMatch(text: string | undefined): string {
  return sanitizeHtml(text ?? '', 'highlight')
}

onClickOutside(searchContainerRef, () => setActive(false))
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
:deep(mark) {
  background-color: rgb(254 249 195);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  border-radius: 0.25rem;
  color: inherit;
}
</style>