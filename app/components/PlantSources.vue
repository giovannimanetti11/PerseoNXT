<template>
  <div class="min-w-0">
    <p class="mt-4 text-sm text-gray-700">
      Oltre al testo della redazione, questa scheda usa dati aperti raccolti da queste fonti e uniti senza doppioni<template v-if="updated">, aggiornati al {{ updated }}</template>.
    </p>
    <ul class="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      <li v-for="source in sources" :key="source.id" class="bg-white rounded-xl px-4 py-3 flex items-baseline justify-between gap-3">
        <a :href="source.homepage" target="_blank" rel="noopener noreferrer" class="font-bold text-blu hover:text-celeste text-sm">{{ source.name }}</a>
        <a :href="source.licenseUrl" target="_blank" rel="noopener noreferrer" class="text-xs text-gray-500 hover:text-blu text-right">{{ source.license }}</a>
      </li>
    </ul>
    <template v-if="data.media.length">
      <h3 class="mt-8 text-sm font-bold uppercase tracking-wider text-gray-500">Crediti immagini</h3>
      <ul class="mt-3 grid gap-1 text-xs text-gray-600">
        <li v-for="item in data.media" :key="item.sourceId">
          <a :href="item.pageUrl" target="_blank" rel="noopener noreferrer" class="hover:text-blu">{{ item.credit }}</a>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PlantData } from '#shared/types/plantData'

const props = defineProps<{ data: PlantData }>()

// The Wikipedia summary is collected but not shown on the page, so Wikipedia is not credited here.
const sources = computed(() => props.data.sources.filter((source) => source.id !== 'wikipedia'))

const updated = computed(() => {
  const latest = props.data.freshness.map((item) => item.fetchedAt).filter((value): value is string => Boolean(value)).sort().at(-1)
  return latest ? new Date(latest).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
})
</script>
