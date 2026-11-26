<template>
  <div class="min-w-0">
    <template v-if="literature">
      <div class="mt-6 grid gap-2 grid-cols-1 md:grid-cols-3">
        <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-xl px-4 py-3">
          <p class="text-2xl font-bold text-blu tabular-nums">{{ formatNumber(stat.value) }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ stat.label }}</p>
        </div>
      </div>

      <div v-if="chart" class="mt-4 bg-white rounded-xl p-4 md:p-6">
        <div class="flex flex-wrap justify-between gap-2 items-baseline">
          <h3 class="text-base font-bold">Articoli pubblicati per anno</h3>
          <p class="text-xs text-gray-500">
            <template v-if="lastComplete">{{ formatNumber(lastComplete.count) }} nel {{ lastComplete.year }} · </template>la barra chiara è l'anno in corso
          </p>
        </div>
        <svg :viewBox="`0 0 ${chart.width} ${chart.height}`" class="mt-3 w-full h-auto" role="img" :aria-label="`Articoli su PubMed per anno, dal ${chart.bars[0]?.year} al ${chart.bars.at(-1)?.year}`">
          <g v-for="tick in chart.ticks" :key="tick.value">
            <line :x1="chart.left" :x2="chart.width - 4" :y1="tick.y" :y2="tick.y" stroke="#D9E3EE" stroke-width="1" />
            <text :x="chart.left - 6" :y="tick.y + 4" text-anchor="end" font-size="10" fill="#64707D">{{ formatNumber(tick.value) }}</text>
          </g>
          <g v-for="(bar, index) in chart.bars" :key="bar.year">
            <rect :x="bar.x" :y="bar.y" :width="bar.width" :height="bar.height" rx="3" :fill="bar.partial ? '#5E9EF4' : '#036297'" :opacity="bar.partial ? 0.55 : 1">
              <title>{{ bar.year }}: {{ formatNumber(bar.count) }} articoli{{ bar.partial ? ' (anno in corso)' : '' }}</title>
            </rect>
            <text v-if="index % 5 === 0 || index === chart.bars.length - 1" :x="bar.x + bar.width / 2" :y="chart.height - 8" text-anchor="middle" font-size="10" fill="#64707D">{{ bar.year }}</text>
          </g>
        </svg>
        <p class="mt-2 text-xs text-gray-500">
          Ricerca PubMed:
          <a :href="`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(literature.query)}`" target="_blank" rel="noopener noreferrer" class="text-blu hover:text-celeste">{{ literature.query }}</a>
        </p>
      </div>

      <template v-if="literature.recentReviews.length">
        <h3 class="mt-8 text-lg font-bold text-celeste">Revisioni più recenti</h3>
        <ul class="mt-3 grid gap-2 lg:grid-cols-2">
          <li v-for="item in literature.recentReviews.slice(0, 4)" :key="item.pmid ?? item.title" class="bg-white rounded-xl p-4">
            <div class="flex flex-wrap gap-1.5">
              <span v-for="type in typesOf(item.types)" :key="type.label" :class="['text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5', type.classes]">{{ type.label }}</span>
              <span v-if="item.openAccess" class="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 border border-verde text-verde">Open access</span>
            </div>
            <a :href="item.url" target="_blank" rel="noopener noreferrer" class="mt-2 block text-sm font-bold text-blu hover:text-celeste leading-snug">{{ item.title }}</a>
            <p class="mt-1 text-xs text-gray-500">
              <span class="italic">{{ item.journal }}</span><template v-if="item.year"> · {{ item.year }}</template><template v-if="item.citations"> · citato {{ formatNumber(item.citations) }} volte</template>
            </p>
          </li>
        </ul>
      </template>
    </template>

    <template v-if="trials?.total">
      <h3 class="mt-8 text-lg font-bold text-celeste">Studi clinici registrati</h3>
      <p class="text-sm text-gray-600 mt-1">
        <span class="font-bold text-blu tabular-nums">{{ formatNumber(trials.total) }}</span> studi su ClinicalTrials.gov che usano la pianta come intervento.
      </p>
      <div class="mt-3 bg-white rounded-xl p-4">
        <div class="flex h-3 rounded-full overflow-hidden" role="img" :aria-label="statusSummary">
          <span v-for="item in trials.byStatus" :key="item.status" :style="{ width: `${(item.count / statusTotal) * 100}%`, background: trialStatus(item.status).color }"></span>
        </div>
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
          <li v-for="item in trials.byStatus" :key="item.status" class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ background: trialStatus(item.status).color }"></span>
            {{ trialStatus(item.status).label }} <span class="tabular-nums font-bold">{{ item.count }}</span>
          </li>
        </ul>
      </div>
      <ul class="mt-2 grid gap-2">
        <li v-for="trial in trials.items.slice(0, 4)" :key="trial.nctId" class="bg-white rounded-xl p-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:gap-4">
          <div class="min-w-0">
            <a :href="trial.url" target="_blank" rel="noopener noreferrer" class="text-sm font-bold text-blu hover:text-celeste leading-snug">{{ trial.title }}</a>
            <p class="mt-1 text-xs text-gray-500">{{ trial.conditions.slice(0, 3).join(', ') }}</p>
          </div>
          <div class="flex flex-wrap md:flex-col md:items-end gap-2 text-xs text-gray-600">
            <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-ghiaccio text-gray-800 text-[11px] font-bold whitespace-nowrap">
              <span class="w-2 h-2 rounded-full" :style="{ background: trialStatus(trial.status).color }"></span>{{ trialStatus(trial.status).label }}
            </span>
            <span>{{ trialPhases(trial.phases) }}<template v-if="trial.startDate"> · dal {{ trial.startDate.slice(0, 7) }}</template><template v-if="trial.enrollment"> · {{ formatNumber(trial.enrollment) }} partecipanti</template></span>
          </div>
        </li>
      </ul>
    </template>

    <p class="mt-4 text-xs text-gray-500">
      I conteggi descrivono quanta ricerca esiste, non se la pianta funziona: per gli effetti documentati vale la sezione "Ricerca scientifica" della redazione.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Literature, StudyType, TrialSummary } from '#shared/types/plantData'

const props = defineProps<{
  literature: Literature | null
  trials: TrialSummary | null
}>()

const stats = computed(() => {
  const lit = props.literature
  return lit
    ? [
        { label: 'articoli su PubMed', value: lit.total },
        { label: 'revisioni e meta-analisi', value: lit.reviews },
        { label: 'studi clinici pubblicati', value: lit.trials },
      ]
    : []
})

const currentYear = new Date().getFullYear()
const lastComplete = computed(() => props.literature?.byYear.filter((item) => item.year < currentYear).at(-1) ?? null)

const chart = computed(() => {
  const data = props.literature?.byYear ?? []
  if (!data.length) return null
  const width = 640, height = 190, left = 40, bottom = 26, top = 12
  const max = Math.max(...data.map((item) => item.count), 1)
  const step = 10 ** Math.floor(Math.log10(max))
  const scaleMax = Math.ceil(max / step) * step
  const y = (value: number) => top + (height - top - bottom) * (1 - value / scaleMax)
  const slot = (width - left - 8) / data.length
  return {
    width, height, left,
    ticks: [0, scaleMax / 2, scaleMax].map((value) => ({ value, y: y(value) })),
    bars: data.map((item, index) => ({
      ...item,
      x: left + index * slot + 2,
      y: y(item.count),
      width: Math.max(slot - 4, 1),
      height: Math.max(height - bottom - y(item.count), 0),
      partial: item.year === currentYear,
    })),
  }
})

const typesOf = (types: StudyType[]) => types.flatMap((type) => STUDY_TYPES[type] ?? []).slice(0, 2)

const statusTotal = computed(() => props.trials?.byStatus.reduce((sum, item) => sum + item.count, 0) || 1)
const statusSummary = computed(() => (props.trials?.byStatus ?? []).map((item) => `${trialStatus(item.status).label}: ${item.count}`).join(', '))
</script>
