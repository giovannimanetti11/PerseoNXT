<template>
  <dl v-if="facts.length" class="grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
    <a
      v-for="fact in facts"
      :key="fact.label"
      :href="`#section${fact.section}`"
      class="group bg-white rounded-xl px-4 py-3 hover:bg-blu transition-colors duration-300 min-w-0"
    >
      <dt class="text-[11px] uppercase tracking-wider text-gray-500 group-hover:text-white/80">{{ fact.label }}</dt>
      <dd :class="['mt-1 text-lg font-bold text-blu group-hover:text-white tabular-nums truncate', fact.italic && 'italic']">{{ fact.value }}</dd>
    </a>
  </dl>
</template>

<script setup lang="ts">
import type { PlantPage } from '#shared/types/content'
import type { PlantData } from '#shared/types/plantData'

const props = defineProps<{
  plant: PlantPage
  data: PlantData | null
  /** Section number by key, for the anchors. */
  sections: Record<string, number>
}>()

interface Fact {
  label: string
  value: string
  section: number
  italic?: boolean
}

const facts = computed<Fact[]>(() => {
  const { data, sections } = props
  const list: (Fact | false | undefined | null | 0 | '')[] = [
    data?.taxonomy?.family && sections.taxonomy && { label: 'Famiglia', value: data.taxonomy.family, section: sections.taxonomy, italic: true },
    props.plant.partiUsate[0] && sections.parts && { label: 'Parte usata', value: props.plant.partiUsate[0].replace(/\s*\(.*\)\s*/, ''), section: sections.parts },
    data?.literature && sections.research && { label: 'Articoli su PubMed', value: formatNumber(data.literature.total), section: sections.research },
    data?.trials?.total && sections.research && { label: 'Studi clinici registrati', value: formatNumber(data.trials.total), section: sections.research },
    data?.compounds.total && sections.chemistry && { label: 'Composti segnalati', value: formatNumber(data.compounds.total), section: sections.chemistry },
    data?.distribution?.countries.length && sections.distribution && { label: 'Paesi con osservazioni', value: formatNumber(data.distribution.countries.length), section: sections.distribution },
  ]
  return list.filter((fact): fact is Fact => Boolean(fact))
})
</script>
