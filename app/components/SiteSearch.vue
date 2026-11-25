<template>
  <div ref="root" class="relative w-5/6 mx-auto -my-4">
    <div class="w-full sm:w-4/5 md:w-3/5 mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
      <div
        :class="[
          'flex items-center h-12 md:h-14 border-2 border-celeste rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-celeste/50',
          { 'rounded-b-none border-b-0': panelOpen },
        ]"
      >
        <label for="wiki-search" class="sr-only">Cerca in Wikiherbalist</label>
        <Icon name="heroicons:magnifying-glass-16-solid" class="ml-2 sm:ml-5 text-celeste text-xl sm:text-2xl flex-shrink-0" />
        <input
          id="wiki-search"
          v-model="term"
          type="search"
          placeholder="Cerca in Wikiherbalist"
          autocomplete="off"
          class="w-full py-2 px-2 sm:px-4 text-sm sm:text-base text-gray-700 leading-tight focus:outline-none"
          @focus="active = true"
          @keydown.enter.prevent="searchNow"
          @keydown.esc="active = false"
        >
        <button v-if="term" type="button" class="mr-2 sm:mr-4 flex-shrink-0" aria-label="Cancella la ricerca" @click="reset">
          <Icon name="ic:baseline-close" class="text-xl sm:text-2xl text-celeste" />
        </button>
      </div>

      <div v-if="panelOpen" class="bg-gray-50 border-2 border-t-0 border-celeste rounded-b-2xl w-full px-2 sm:px-4" aria-live="polite">
        <div v-if="searching" class="flex justify-center items-center p-4">
          <Icon name="eos-icons:three-dots-loading" class="text-4xl text-celeste" />
        </div>

        <template v-else-if="results.length">
          <ul class="max-h-[60vh] overflow-y-auto scrollbar-hide">
            <li v-for="hit in pageResults" :key="`${hit.contentType}-${hit.objectID}`">
              <NuxtLink :to="contentPath(hit.contentType, hit.objectID)" class="flex items-center py-2 hover:bg-gray-100 w-full" @click="active = false">
                <img
                  :src="hit.imageUrl || '/media/default-og-image.jpg'"
                  :alt="hit.imageAlt || hit.title"
                  class="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 mr-2 sm:mr-4 rounded-lg object-cover bg-gray-100"
                  width="80"
                  height="80"
                  loading="lazy"
                >
                <span class="flex-grow min-w-0">
                  <span class="block text-sm sm:text-lg font-bold truncate" v-html="highlighted(hit, 'title')"></span>
                  <span v-if="hit.contentType === 'plant'" class="block text-xs sm:text-sm italic truncate" v-html="highlighted(hit, 'nomeScientifico')"></span>
                  <span v-else-if="hit.contentType === 'blog' && hit.authorName" class="block text-xs sm:text-sm text-gray-600 truncate">Di {{ hit.authorName }}</span>
                </span>
                <span class="flex-shrink-0 ml-1 sm:ml-2" :title="TYPE_INFO[hit.contentType].label">
                  <Icon :name="TYPE_INFO[hit.contentType].icon" :class="['text-xl sm:text-2xl', TYPE_INFO[hit.contentType].color]" />
                  <span class="sr-only">{{ TYPE_INFO[hit.contentType].label }}</span>
                </span>
              </NuxtLink>
            </li>
          </ul>

          <nav v-if="totalPages > 1" class="flex justify-center items-center py-4 gap-1" aria-label="Pagine dei risultati">
            <button
              v-for="page in totalPages"
              :key="page"
              type="button"
              :aria-current="page === currentPage ? 'page' : undefined"
              :class="[
                'w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300',
                page === currentPage ? 'bg-blu text-white' : 'bg-ghiaccio text-blu hover:bg-celeste hover:text-white',
              ]"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
          </nav>
        </template>

        <div v-else class="p-4 sm:p-10">
          <p class="text-red-500 border border-red-500 rounded-lg p-2 text-xs sm:text-sm">
            Nessun risultato. Prova con un'altra parola, per esempio il nome scientifico.
          </p>
          <p class="text-xs text-gray-600 mt-2">
            Manca una pianta o un termine?
            <NuxtLink to="/#section-contacts" class="text-blu hover:text-celeste">Segnalacelo</NuxtLink>.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside, watchDebounced } from '@vueuse/core'
import type { ContentType, SearchRecord } from '#shared/types/content'

type HighlightField = 'title' | 'nomeScientifico'

interface SearchHit extends SearchRecord {
  _highlightResult?: Partial<Record<HighlightField, { value: string }>>
}

const RESULTS_PER_PAGE = 5
const TYPE_INFO: Record<ContentType, { label: string; icon: string; color: string }> = {
  plant: { label: 'Pianta medicinale', icon: 'mdi:flower', color: 'text-verde' },
  blog: { label: 'Articolo del blog', icon: 'mdi:post', color: 'text-blu' },
  glossary: { label: 'Glossario', icon: 'mdi:book-open-page-variant', color: 'text-celeste' },
}

const { applicationId, searchApiKey, indexName } = useRuntimeConfig().public.algolia
const root = ref<HTMLElement | null>(null)
const term = ref('')
const active = ref(false)
const searching = ref(false)
const searched = ref(false)
const results = ref<SearchHit[]>([])
const currentPage = ref(1)

const panelOpen = computed(() => active.value && term.value.trim() !== '' && (searching.value || searched.value))
const totalPages = computed(() => Math.ceil(results.value.length / RESULTS_PER_PAGE))
const pageResults = computed(() => results.value.slice((currentPage.value - 1) * RESULTS_PER_PAGE, currentPage.value * RESULTS_PER_PAGE))

let requestId = 0

async function search(query: string) {
  const id = ++requestId
  searching.value = true
  try {
    const response = await $fetch<{ hits: SearchHit[] }>(`https://${applicationId}-dsn.algolia.net/1/indexes/${indexName}/query`, {
      method: 'POST',
      headers: { 'X-Algolia-API-Key': searchApiKey, 'X-Algolia-Application-Id': applicationId },
      body: {
        query,
        hitsPerPage: 100,
        attributesToRetrieve: ['title', 'nomeScientifico', 'authorName', 'imageUrl', 'imageAlt', 'contentType'],
        attributesToHighlight: ['title', 'nomeScientifico'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      },
    })
    if (id !== requestId) return
    results.value = response.hits
    window.gtag?.('event', 'search', { search_term: query })
  } catch (error) {
    if (id !== requestId) return
    console.error('[search]', error)
    results.value = []
  } finally {
    if (id === requestId) {
      searching.value = false
      searched.value = true
      currentPage.value = 1
    }
  }
}

function searchNow() {
  const query = term.value.trim()
  if (query) search(query)
}

function reset() {
  requestId++
  term.value = ''
  results.value = []
  searched.value = false
  searching.value = false
}

function highlighted(hit: SearchHit, field: HighlightField): string {
  return sanitizeHtml(hit._highlightResult?.[field]?.value ?? hit[field] ?? '', 'highlight')
}

watchDebounced(term, (value) => {
  active.value = true
  if (value.trim()) search(value.trim())
  else reset()
}, { debounce: 300 })

onClickOutside(root, () => { active.value = false })
</script>

<style scoped>
:deep(mark) {
  background-color: rgb(254 249 195);
  border-radius: 0.25rem;
  color: inherit;
}
</style>
