<template>
  <div>
    <div class="mt-6 flex flex-wrap items-baseline gap-3">
      <p class="py-2 px-4 bg-white text-blu rounded-xl text-sm md:text-base">
        <span class="italic">{{ taxonomy?.acceptedName ?? scientificName }}</span>
        <template v-if="taxonomy?.authorship"> {{ taxonomy.authorship }}</template>
      </p>
      <p v-if="taxonomy?.family" class="text-sm text-gray-600">Famiglia <span class="italic">{{ taxonomy.family }}</span></p>
    </div>

    <template v-if="taxonomy">
      <h3 class="mt-8 text-sm font-bold uppercase tracking-wider text-gray-500">Classificazione</h3>
      <ol class="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
        <li v-for="(item, index) in taxonomy.classification" :key="item.rank" class="flex items-center gap-1.5">
          <Icon v-if="index" name="heroicons:chevron-right" class="w-4 h-4 text-gray-400" aria-hidden="true" />
          <span class="bg-white rounded-lg px-3 py-1.5 shadow-sm">
            <span class="text-gray-500 text-xs">{{ RANK_LABELS[item.rank] }}</span>
            <span :class="['text-blu ml-1', (item.rank === 'genus' || item.rank === 'species') && 'italic']">{{ item.name }}</span>
          </span>
        </li>
      </ol>

      <p v-if="taxonomy.basionym" class="mt-6 text-sm">
        <span class="font-bold">Basionimo</span>:
        <span class="italic">{{ taxonomy.basionym.canonical }}</span> {{ taxonomy.basionym.authorship }}
      </p>

      <template v-if="taxonomy.synonyms.length">
        <h3 class="mt-8 text-sm font-bold uppercase tracking-wider text-gray-500">
          Sinonimi <span class="font-normal normal-case tracking-normal">({{ taxonomy.synonyms.length }})</span>
        </h3>
        <ul class="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <li v-for="synonym in visibleSynonyms" :key="synonym.canonical" class="bg-white rounded-xl px-4 py-2.5 text-sm flex items-baseline justify-between gap-3">
            <span class="min-w-0"><span class="italic">{{ synonym.canonical }}</span> <span class="text-gray-500">{{ synonym.authorship }}</span></span>
            <span class="flex gap-1 shrink-0">
              <span v-for="source in sourcesOf(synonym.sources)" :key="source" class="text-[10px] font-bold text-blu bg-ghiaccio rounded px-1.5 py-0.5">{{ source }}</span>
            </span>
          </li>
        </ul>
        <button
          v-if="taxonomy.synonyms.length > PREVIEW"
          type="button"
          class="mt-3 py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300 text-sm"
          @click="showAll = !showAll"
        >
          {{ showAll ? 'Mostra meno' : `Mostra tutti i ${taxonomy.synonyms.length} sinonimi` }}
        </button>
      </template>

      <template v-if="links.length">
        <h3 class="mt-8 text-sm font-bold uppercase tracking-wider text-gray-500">Nelle banche dati</h3>
        <ul class="mt-3 flex flex-wrap gap-2">
          <li v-for="link in links" :key="link.label">
            <a :href="link.url" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-sm py-1.5 px-3 rounded-full border border-blu text-blu hover:bg-blu hover:text-white transition-colors duration-300">
              {{ link.label }}
              <Icon name="heroicons:arrow-top-right-on-square" class="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Provenance, Taxonomy } from '#shared/types/plantData'

const props = defineProps<{
  taxonomy: Taxonomy | null
  scientificName: string
}>()

const PREVIEW = 12
const showAll = ref(false)
const visibleSynonyms = computed(() => (showAll.value ? props.taxonomy?.synonyms ?? [] : props.taxonomy?.synonyms.slice(0, PREVIEW) ?? []))
const sourcesOf = (sources: Provenance[]) => [...new Set(sources.map((item) => SOURCE_SHORT[item.source] ?? item.source))]

const links = computed(() => {
  const ids = props.taxonomy?.ids
  if (!ids) return []
  return [
    ids.gbif && { label: 'GBIF', url: `https://www.gbif.org/species/${ids.gbif}` },
    ids.wfo && { label: 'World Flora Online', url: `https://www.worldfloraonline.org/taxon/${ids.wfo}` },
    ids.col && { label: 'Catalogue of Life', url: `https://www.catalogueoflife.org/data/taxon/${ids.col}` },
    ids.wikidata && { label: 'Wikidata', url: `https://www.wikidata.org/wiki/${ids.wikidata}` },
    ids.ncbi && { label: 'NCBI Taxonomy', url: `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${ids.ncbi}` },
    ids.inaturalist && { label: 'iNaturalist', url: `https://www.inaturalist.org/taxa/${ids.inaturalist}` },
  ].filter((link): link is { label: string; url: string } => Boolean(link))
})
</script>
