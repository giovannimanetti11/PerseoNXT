<template>
  <div class="min-w-0 grid gap-4 md:grid-cols-2 mt-4">
    <div v-if="parts.length" class="bg-white/60 rounded-xl p-4">
      <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500">Parti usate</h3>
      <ul class="mt-3 flex flex-wrap gap-2">
        <li v-for="part in parts" :key="part" class="py-2 px-4 bg-white text-blu rounded-xl text-xs md:text-sm">{{ part }}</li>
      </ul>
    </div>
    <div v-if="names.length || otherNames.length" class="bg-white/60 rounded-xl p-4">
      <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500">Nome comune</h3>
      <ul class="mt-3 flex flex-wrap gap-2">
        <li v-for="name in names" :key="name" class="py-2 px-4 bg-white text-blu rounded-xl text-xs md:text-sm">{{ name }}</li>
      </ul>
      <template v-if="otherNames.length">
        <p class="mt-4 text-xs text-gray-500">Altri nomi nelle banche dati</p>
        <ul class="mt-2 flex flex-wrap gap-1.5">
          <li v-for="name in otherNames" :key="`${name.lang}-${name.name}`" class="text-xs py-1 px-2.5 rounded-full bg-ghiaccio text-blu">
            <span class="font-bold uppercase text-[10px] mr-1">{{ name.lang }}</span>{{ name.name }}
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommonName } from '#shared/types/plantData'

const props = defineProps<{
  parts: string[]
  /** Names chosen by the editors. */
  names: string[]
  /** Names from GBIF, Wikidata and iNaturalist. */
  sourceNames: CommonName[]
}>()

const key = (name: string) => name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const otherNames = computed(() => {
  const editorial = new Set(props.names.map(key))
  return props.sourceNames.filter((name) => !editorial.has(key(name.name))).slice(0, 16)
})
</script>
