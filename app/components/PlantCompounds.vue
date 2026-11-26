<template>
  <div>
    <div class="mt-8 flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-lg font-bold text-celeste">Composti segnalati in letteratura</h3>
        <p class="text-sm text-gray-600 mt-1">
          <span class="tabular-nums font-bold text-blu">{{ formatNumber(total) }}</span>
          composti isolati in <span class="italic">{{ scientificName }}</span> secondo gli articoli raccolti da LOTUS.
        </p>
      </div>
      <label class="w-full md:w-72">
        <span class="sr-only">Cerca un composto</span>
        <input
          v-model="query"
          type="search"
          placeholder="Cerca per nome o formula"
          maxlength="80"
          class="w-full h-11 border border-celeste rounded-2xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-blu"
        >
      </label>
    </div>

    <div class="mt-4 bg-white rounded-xl overflow-x-auto">
      <table class="w-full text-sm min-w-[560px]">
        <thead>
          <tr class="text-left text-[11px] uppercase tracking-wider text-gray-500">
            <th scope="col" class="py-3 pl-4 pr-4 font-bold">Composto</th>
            <th scope="col" class="py-3 pr-4 font-bold">Formula</th>
            <th scope="col" class="py-3 pr-4 font-bold text-right">g/mol</th>
            <th scope="col" class="py-3 pr-4 font-bold text-right" title="Articoli che segnalano il composto nella specie">Articoli</th>
            <th scope="col" class="py-3 pr-4"><span class="sr-only">Collegamento</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="compound in items" :key="compound.inchikey || compound.wikidataId || compound.name" class="border-t border-gray-100">
            <td class="py-2.5 pl-4 pr-4 align-top text-gray-900">{{ compound.name }}</td>
            <td class="py-2.5 pr-4 align-top whitespace-nowrap text-gray-700">
              <template v-for="(part, index) in formulaParts(compound.formula)" :key="index"><sub v-if="part.sub">{{ part.text }}</sub><template v-else>{{ part.text }}</template></template>
            </td>
            <td class="py-2.5 pr-4 align-top text-right tabular-nums text-gray-700">{{ compound.molecularWeight ? formatNumber(compound.molecularWeight) : '–' }}</td>
            <td class="py-2.5 pr-4 align-top text-right tabular-nums">{{ compound.references.length || '–' }}</td>
            <td class="py-2.5 pr-4 align-top text-right">
              <a v-if="compound.pubchemCid" :href="`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.pubchemCid}`" target="_blank" rel="noopener noreferrer" class="text-blu hover:text-celeste text-xs whitespace-nowrap">PubChem</a>
            </td>
          </tr>
          <tr v-if="!items.length && !loading">
            <td colspan="5" class="py-6 text-center text-gray-500">Nessun composto corrisponde alla ricerca.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
      <p>Fonte: LOTUS tramite Wikidata, proprietà chimiche da PubChem. Indica la presenza del composto, non la quantità.</p>
      <button
        v-if="items.length < matching"
        type="button"
        :disabled="loading"
        class="py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300 text-sm disabled:opacity-60"
        @click="loadMore"
      >
        {{ loading ? 'Caricamento…' : 'Mostra altri composti' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import type { Compound, Page } from '#shared/types/plantData'

const props = defineProps<{
  slug: string
  scientificName: string
  total: number
  /** First page, delivered with the plant document. */
  initial: Compound[]
}>()

const PAGE = 30
const items = ref<Compound[]>([...props.initial])
const matching = ref(props.total)
const query = ref('')
const loading = ref(false)
let request = 0

async function fetchPage(offset: number): Promise<Page<Compound> | null> {
  const id = ++request
  loading.value = true
  try {
    const page = await $fetch<Page<Compound>>(`/api/plant-data/${props.slug}/compounds`, {
      query: { offset, limit: PAGE, ...(query.value.trim() ? { q: query.value.trim() } : {}) },
    })
    return id === request ? page : null
  } catch {
    return null
  } finally {
    if (id === request) loading.value = false
  }
}

async function loadMore() {
  const page = await fetchPage(items.value.length)
  if (!page) return
  items.value = [...items.value, ...page.items]
  matching.value = page.total
}

watchDebounced(query, async (value) => {
  if (!value.trim()) {
    items.value = [...props.initial]
    matching.value = props.total
    return
  }
  const page = await fetchPage(0)
  if (!page) return
  items.value = page.items
  matching.value = page.total
}, { debounce: 300 })

watch(() => props.slug, () => {
  query.value = ''
  items.value = [...props.initial]
  matching.value = props.total
})
</script>
