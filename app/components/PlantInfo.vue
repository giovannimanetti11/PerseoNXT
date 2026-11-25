<template>
  <ContentHeader
    :title="plant.title"
    :author="plant.authorName"
    :published="plant.date"
    :modified="plant.modified"
    kind="plant"
    :reading-time="plant.readingTime"
    speakable
  >
    <template #badge>
      <span v-if="lastRevision" class="relative group">
        <img src="/media/icon_verified.svg" alt="Scheda revisionata" class="w-6 h-6 cursor-help" width="24" height="24">
        <span class="absolute z-20 hidden group-hover:block bg-white border border-blu rounded-lg shadow-lg p-2 text-sm text-gray-700 w-48 left-1/2 -translate-x-1/2 mt-2">
          Ultima revisione: {{ formatItalianDate(lastRevision) }}
        </span>
      </span>
    </template>

    <p class="text-xl italic text-gray-700">{{ plant.nomeScientifico }}</p>

    <div v-if="taxonomy?.basionym" class="mt-4">
      <span class="relative group inline-flex items-center">
        Basionimo
        <Icon name="mdi:information-outline" class="text-blu ml-1 cursor-help" />
        <span class="absolute z-20 hidden group-hover:block top-full bg-white border border-blu rounded-lg shadow-lg p-4 text-sm text-gray-700 w-64 left-1/2 -translate-x-1/2 mt-2" role="tooltip">
          Il nome scientifico originale da cui deriva quello attuale. Quando una specie viene spostata in un altro genere,
          il nome dell'autore originale va tra parentesi, seguito da quello di chi l'ha riclassificata.
        </span>
      </span>:
      <span class="italic ml-2 text-gray-700">{{ taxonomy.basionym }}</span>
    </div>

    <details v-if="taxonomy?.synonyms.length" class="relative mt-2 group/syn">
      <summary class="inline-flex items-center py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300 cursor-pointer list-none">
        <Icon name="bi:list" class="text-xl md:text-2xl mr-2" />
        Sinonimi ({{ taxonomy.synonyms.length }})
      </summary>
      <ul class="absolute z-10 mt-2 bg-white rounded-md shadow-md p-2 max-h-60 overflow-y-auto w-full">
        <li v-for="synonym in taxonomy.synonyms" :key="synonym" class="italic py-1 border-b last:border-b-0 border-gray-200">
          {{ synonym }}
        </li>
      </ul>
    </details>
  </ContentHeader>

  <div v-if="publications" class="flex flex-row items-center mt-4">
    <a :href="pubmedUrl" target="_blank" rel="noopener noreferrer" class="hover:opacity-80">
      <img src="/media/pubmed_logo.png" alt="PubMed" width="100" height="32" class="h-8 w-auto mr-2">
    </a>
    <a :href="pubmedUrl" target="_blank" rel="noopener noreferrer" class="text-lg font-bold text-blu hover:text-celeste mr-1">
      {{ publications.toLocaleString('it-IT') }}
    </a>
    pubblicazioni
  </div>

  <ul v-if="taxonomy?.classification.length" class="mt-6 max-w-96">
    <li v-for="item in taxonomy.classification" :key="item.rank" class="px-4 py-2 mt-1.5 bg-white border rounded-lg shadow">
      {{ item.rank }}: <a :href="item.link" class="text-blu hover:text-celeste" target="_blank" rel="noopener noreferrer">{{ item.name }}</a>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { PlantPage, TaxonomyInfo } from '#shared/types/content'

const props = defineProps<{ plant: PlantPage }>()

const lastRevision = computed(() => props.plant.revisionDates.at(-1) ?? '')
const binomial = computed(() => props.plant.nomeScientifico.split(' ').slice(0, 2).join(' '))
const pubmedUrl = computed(() => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(binomial.value)}`)

// Secondary data from GBIF and PubMed: loaded after the page, keyed by plant so
// navigating between monographs never shows the previous plant's values.
const { data: taxonomy } = useLazyFetch<TaxonomyInfo>('/api/taxonomy', {
  key: computed(() => `taxonomy-${props.plant.slug}`),
  query: { name: computed(() => props.plant.nomeScientifico) },
  server: false,
})

const { data: pubmed } = useLazyFetch<{ count: number }>('/api/pubmed-count', {
  key: computed(() => `pubmed-${props.plant.slug}`),
  query: { term: binomial },
  server: false,
})
const publications = computed(() => pubmed.value?.count ?? 0)
</script>
