<template>
  <div>
    <div class="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <LazyObservationsMap :nome-scientifico="scientificName" class="!w-full !mt-0" />
      <div v-if="distribution" class="bg-white rounded-xl p-4 self-start">
        <p class="text-sm">
          <span class="text-2xl font-bold text-blu tabular-nums">{{ formatNumber(distribution.occurrences) }}</span>
          <span class="text-gray-600"> osservazioni su GBIF in {{ formatNumber(distribution.countries.length) }} paesi</span>
        </p>
        <p v-if="distribution.inaturalistObservations" class="text-xs text-gray-500 mt-1">
          {{ formatNumber(distribution.inaturalistObservations) }} su iNaturalist
        </p>
        <template v-if="top.length">
          <h3 class="mt-5 text-sm font-bold uppercase tracking-wider text-gray-500">Paesi con più osservazioni</h3>
          <ul class="mt-3 grid gap-2">
            <li v-for="country in top" :key="country.code" class="grid grid-cols-[7.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-sm">
              <span class="truncate">{{ countryName(country.code) }}</span>
              <span class="h-2 rounded-full bg-ghiaccio overflow-hidden">
                <span class="block h-full bg-verde rounded-full" :style="{ width: `${(country.count / max) * 100}%` }"></span>
              </span>
              <span class="text-right tabular-nums text-gray-600">{{ formatNumber(country.count) }}</span>
            </li>
          </ul>
        </template>
      </div>
    </div>
    <p class="mt-3 text-xs text-gray-500">Le osservazioni includono piante coltivate e naturalizzate: non descrivono l'areale d'origine.</p>
  </div>
</template>

<script setup lang="ts">
import type { Distribution } from '#shared/types/plantData'

const props = defineProps<{
  scientificName: string
  distribution: Distribution | null
}>()

const top = computed(() => props.distribution?.countries.slice(0, 8) ?? [])
const max = computed(() => top.value[0]?.count || 1)
</script>
