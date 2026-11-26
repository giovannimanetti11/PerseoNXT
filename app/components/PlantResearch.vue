<template>
  <div class="min-w-0">
    <template v-if="literature">
      <div class="mt-6 grid gap-2 grid-cols-2 lg:grid-cols-4">
        <a
          v-for="stat in stats"
          :key="stat.label"
          :href="stat.href"
          :target="stat.external ? '_blank' : undefined"
          :rel="stat.external ? 'noopener noreferrer' : undefined"
          class="group bg-white rounded-xl px-4 py-3 hover:ring-2 hover:ring-celeste focus-visible:ring-2 focus-visible:ring-celeste outline-none transition"
        >
          <p class="text-2xl font-bold text-blu tabular-nums group-hover:text-celeste">{{ formatNumber(stat.value) }}</p>
          <p class="text-xs text-gray-700 mt-0.5 font-bold">{{ stat.label }}</p>
          <p class="text-[11px] text-gray-500">{{ stat.source }}</p>
        </a>
      </div>
      <p v-if="trials?.total" class="mt-2 text-xs text-gray-500">
        I due numeri sugli studi clinici misurano cose diverse: gli articoli sono risultati pubblicati e indicizzati su PubMed, gli studi registrati sono protocolli iscritti a ClinicalTrials.gov, compresi quelli in corso o mai pubblicati. Molti studi pubblicati, soprattutto i più vecchi o condotti fuori dagli Stati Uniti, non compaiono in quel registro.
      </p>

      <div v-if="chart" class="mt-4 bg-white rounded-xl p-4 md:p-6">
        <div class="flex flex-wrap justify-between gap-2 items-baseline">
          <h3 class="text-base font-bold">Articoli pubblicati per anno</h3>
          <p class="text-xs text-gray-500">Passa sopra o tocca una barra · la barra chiara è l'anno in corso</p>
        </div>
        <p class="mt-2 text-sm min-h-[1.5rem]" aria-live="polite">
          <template v-if="selectedBar">
            <span class="font-bold text-blu tabular-nums">{{ selectedBar.year }}</span>:
            <span class="tabular-nums">{{ formatNumber(selectedBar.count) }}</span> {{ selectedBar.count === 1 ? 'articolo' : 'articoli' }}<template v-if="selectedBar.partial"> finora</template>
            <a v-if="selectedBar.count" :href="pubmedUrl(literature.query, selectedBar.year)" target="_blank" rel="noopener noreferrer" class="ml-2 text-xs font-bold text-blu hover:text-celeste whitespace-nowrap">Vedi su PubMed →</a>
          </template>
        </p>
        <svg
          :viewBox="`0 0 ${chart.width} ${chart.height}`"
          class="mt-1 w-full h-auto outline-none focus-visible:ring-2 focus-visible:ring-celeste rounded"
          role="img"
          tabindex="0"
          :aria-label="`Articoli su PubMed per anno, dal ${chart.bars[0]?.year} al ${chart.bars.at(-1)?.year}. Usa le frecce per scorrere gli anni, Invio per aprire la ricerca su PubMed.`"
          @keydown.left.prevent="move(-1)"
          @keydown.right.prevent="move(1)"
          @keydown.enter.prevent="openSelected"
          @mouseleave="hovered = null"
        >
          <g v-for="tick in chart.ticks" :key="tick.value">
            <line :x1="chart.left" :x2="chart.width - 4" :y1="tick.y" :y2="tick.y" stroke="#D9E3EE" stroke-width="1" />
            <text :x="chart.left - 6" :y="tick.y + 4" text-anchor="end" font-size="10" fill="#64707D">{{ formatNumber(tick.value) }}</text>
          </g>
          <g v-for="(bar, index) in chart.bars" :key="bar.year">
            <rect
              :x="bar.x" :y="bar.y" :width="bar.width" :height="bar.height" rx="3"
              :fill="bar.partial ? '#5E9EF4' : '#036297'"
              :opacity="activeYear === null || activeYear === bar.year ? (bar.partial ? 0.55 : 1) : 0.35"
              class="transition-opacity"
            />
            <text v-if="activeYear === bar.year" :x="bar.x + bar.width / 2" :y="bar.y - 4" text-anchor="middle" font-size="10" font-weight="700" fill="#036297">{{ formatNumber(bar.count) }}</text>
            <text v-if="index % 5 === 0 || index === chart.bars.length - 1" :x="bar.x + bar.width / 2" :y="chart.height - 8" text-anchor="middle" font-size="10" fill="#64707D">{{ bar.year }}</text>
            <!-- Full-height hit area: thin or empty bars stay easy to hover and tap. -->
            <rect
              :x="bar.slotX" :y="chart.top" :width="bar.slotWidth" :height="chart.plotBottom - chart.top"
              fill="transparent" class="cursor-pointer"
              @mouseenter="hovered = bar.year"
              @click="selectBar(bar.year)"
            >
              <title>{{ bar.year }}: {{ formatNumber(bar.count) }} articoli{{ bar.partial ? ' (anno in corso)' : '' }}</title>
            </rect>
          </g>
        </svg>
        <p class="mt-2 text-xs text-gray-500">
          Ricerca PubMed:
          <a :href="pubmedUrl(literature.query)" target="_blank" rel="noopener noreferrer" class="text-blu hover:text-celeste">{{ literature.query }}</a>
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
      <h3 :id="TRIALS_ANCHOR" class="mt-8 text-lg font-bold text-celeste scroll-mt-24">Studi clinici registrati</h3>
      <p class="text-sm text-gray-600 mt-1">
        <span class="font-bold text-blu tabular-nums">{{ formatNumber(trials.total) }}</span> {{ trials.total === 1 ? 'studio' : 'studi' }} su ClinicalTrials.gov che usano la pianta come intervento. Tocca uno stato per filtrare l'elenco.
      </p>
      <div class="mt-3 bg-white rounded-xl p-4">
        <div class="flex h-3 rounded-full overflow-hidden gap-px" role="img" :aria-label="statusSummary">
          <button
            v-for="item in trials.byStatus" :key="item.status" type="button" tabindex="-1"
            :title="`${trialStatus(item.status).label}: ${item.count}`"
            :style="{ width: `${(item.count / statusTotal) * 100}%`, background: trialStatus(item.status).color }"
            :class="['h-full transition-opacity', status && status !== item.status ? 'opacity-30' : '']"
            @click="toggleStatus(item.status)"
          ></button>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button" :aria-pressed="status === ''"
            :class="['rounded-full px-3 py-1 text-xs font-bold border transition', status === '' ? 'bg-blu text-white border-blu' : 'bg-white text-gray-700 border-gray-200 hover:border-celeste']"
            @click="setStatus('')"
          >
            Tutti <span class="tabular-nums">{{ statusTotal }}</span>
          </button>
          <button
            v-for="item in trials.byStatus" :key="item.status" type="button" :aria-pressed="status === item.status"
            :class="['inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition', status === item.status ? 'bg-ghiaccio text-blu border-blu font-bold' : 'bg-white text-gray-700 border-gray-200 hover:border-celeste']"
            @click="toggleStatus(item.status)"
          >
            <span class="w-2.5 h-2.5 rounded-full" :style="{ background: trialStatus(item.status).color }"></span>
            {{ trialStatus(item.status).label }} <span class="tabular-nums font-bold">{{ item.count }}</span>
          </button>
        </div>
      </div>

      <ul class="mt-2 grid gap-2" :aria-busy="loading">
        <li v-for="trial in shown" :key="trial.nctId" class="bg-white rounded-xl">
          <button
            type="button"
            class="group w-full text-left p-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:gap-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-celeste"
            :aria-expanded="isOpen(trial.nctId)"
            :aria-controls="`trial-${trial.nctId}`"
            @click="toggleTrial(trial.nctId)"
          >
            <span class="min-w-0 block">
              <span class="block text-sm font-bold text-blu group-hover:text-celeste leading-snug">{{ trial.title }}</span>
              <span class="block mt-1 text-xs text-gray-500">
                <span class="font-mono">{{ trial.nctId }}</span><template v-if="trial.conditions.length"> · {{ trial.conditions.slice(0, 3).join(', ') }}</template>
              </span>
            </span>
            <span class="flex flex-wrap md:flex-col md:items-end gap-2 text-xs text-gray-600">
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-ghiaccio text-gray-800 text-[11px] font-bold whitespace-nowrap">
                <span class="w-2 h-2 rounded-full" :style="{ background: trialStatus(trial.status).color }"></span>{{ trialStatus(trial.status).label }}
              </span>
              <span>{{ trialPhases(trial.phases) }}<template v-if="trial.startDate"> · dal {{ trial.startDate.slice(0, 7) }}</template><template v-if="trial.enrollment"> · {{ formatNumber(trial.enrollment) }} partecipanti</template></span>
              <span class="inline-flex items-center gap-1 font-bold text-blu group-hover:text-celeste">
                {{ isOpen(trial.nctId) ? 'Chiudi' : 'Dettagli' }}
                <svg :class="['w-3 h-3 transition-transform', isOpen(trial.nctId) ? 'rotate-180' : '']" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </span>
            </span>
          </button>
          <div v-if="isOpen(trial.nctId)" :id="`trial-${trial.nctId}`" class="px-4 pb-4 pt-3 border-t border-ghiaccio grid gap-4 text-sm text-gray-700">
            <dl class="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
              <div v-if="trial.sponsor"><dt class="text-gray-500">Promotore</dt><dd class="font-bold text-gray-800">{{ trial.sponsor }}</dd></div>
              <div v-if="trial.countries.length"><dt class="text-gray-500">{{ trial.countries.length === 1 ? 'Paese' : 'Paesi' }}</dt><dd class="font-bold text-gray-800">{{ trial.countries.join(', ') }}</dd></div>
              <div v-if="trial.startDate"><dt class="text-gray-500">Inizio</dt><dd class="font-bold text-gray-800">{{ formatTrialDate(trial.startDate) }}</dd></div>
              <div v-if="trial.completionDate"><dt class="text-gray-500">{{ ENDED.has(trial.status) ? 'Conclusione' : 'Conclusione prevista' }}</dt><dd class="font-bold text-gray-800">{{ formatTrialDate(trial.completionDate) }}</dd></div>
              <div><dt class="text-gray-500">Risultati nel registro</dt><dd class="font-bold text-gray-800">{{ trial.hasResults ? 'Pubblicati' : 'Non pubblicati' }}</dd></div>
            </dl>
            <div v-if="trial.interventions.length">
              <p class="text-xs font-bold uppercase tracking-wider text-gray-500">Trattamenti</p>
              <div class="mt-2 grid gap-2">
                <div v-for="item in trial.interventions" :key="item.name" class="rounded-lg bg-ghiaccio/60 px-3 py-2">
                  <p class="text-sm font-bold text-gray-800">
                    {{ item.name }} <span class="ml-1 text-[10px] font-bold uppercase tracking-wide text-blu">{{ interventionType(item.type) }}</span>
                  </p>
                  <p v-if="item.description" class="mt-1 text-xs leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]" lang="en">{{ item.description }}</p>
                </div>
              </div>
            </div>
            <div v-if="trial.summary">
              <p class="text-xs font-bold uppercase tracking-wider text-gray-500">Sintesi dal registro <span class="normal-case tracking-normal font-normal">(in inglese)</span></p>
              <p class="mt-2 text-xs leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]" lang="en">{{ trial.summary }}</p>
            </div>
            <a :href="trial.url" target="_blank" rel="noopener noreferrer" class="text-xs font-bold text-blu hover:text-celeste">Scheda completa su ClinicalTrials.gov →</a>
          </div>
        </li>
      </ul>
      <p v-if="failed" class="mt-2 text-xs text-gray-500">Elenco non disponibile al momento.</p>
      <div v-if="shown.length < matching || expanded" class="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <button
          v-if="shown.length < matching" type="button" :disabled="loading"
          class="py-2 px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300 text-sm disabled:opacity-60"
          @click="showMore"
        >
          {{ loading ? 'Caricamento…' : `Mostra altri studi (${formatNumber(matching - shown.length)})` }}
        </button>
        <button v-if="expanded" type="button" class="font-bold text-blu hover:text-celeste" @click="collapse">Mostra meno</button>
        <span>{{ formatNumber(shown.length) }} di {{ formatNumber(matching) }}</span>
      </div>
    </template>

    <p class="mt-4 text-xs text-gray-500">
      I conteggi descrivono quanta ricerca esiste, non se la pianta funziona: per gli effetti documentati vale la sezione "Ricerca scientifica" della redazione.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ClinicalTrial, Literature, Page, StudyType, TrialSummary } from '#shared/types/plantData'

const props = defineProps<{
  slug: string
  literature: Literature | null
  trials: TrialSummary | null
}>()

const TRIALS_ANCHOR = 'studi-clinici-registrati'

const stats = computed(() => {
  const lit = props.literature
  if (!lit) return []
  const items = [
    { label: 'articoli', source: 'su PubMed', value: lit.total, href: pubmedUrl(lit.query), external: true },
    { label: 'revisioni e meta-analisi', source: 'su PubMed', value: lit.reviews, href: pubmedUrl(lit.query, 'reviews'), external: true },
    { label: 'articoli su studi clinici', source: 'pubblicati, su PubMed', value: lit.trials, href: pubmedUrl(lit.query, 'trials'), external: true },
  ]
  if (props.trials?.total) items.push({ label: 'studi clinici registrati', source: 'su ClinicalTrials.gov', value: props.trials.total, href: `#${TRIALS_ANCHOR}`, external: false })
  return items
})

/* Chart */
const currentYear = new Date().getFullYear()
const hovered = ref<number | null>(null)
const selected = ref<number | null>(null)

const chart = computed(() => {
  const data = props.literature?.byYear ?? []
  if (!data.length) return null
  const width = 640, height = 200, left = 40, bottom = 26, top = 18
  const max = Math.max(...data.map((item) => item.count), 1)
  const step = 10 ** Math.floor(Math.log10(max))
  const scaleMax = Math.ceil(max / step) * step
  const plotBottom = height - bottom
  const y = (value: number) => top + (plotBottom - top) * (1 - value / scaleMax)
  const slot = (width - left - 8) / data.length
  return {
    width, height, left, top, plotBottom,
    ticks: [0, scaleMax / 2, scaleMax].map((value) => ({ value, y: y(value) })),
    bars: data.map((item, index) => ({
      ...item,
      x: left + index * slot + 2,
      y: y(item.count),
      width: Math.max(slot - 4, 1),
      height: Math.max(plotBottom - y(item.count), 0),
      slotX: left + index * slot,
      slotWidth: slot,
      partial: item.year === currentYear,
    })),
  }
})

const defaultYear = computed(() => {
  const bars = chart.value?.bars ?? []
  return (bars.filter((bar) => !bar.partial).at(-1) ?? bars.at(-1))?.year ?? null
})
const activeYear = computed(() => hovered.value ?? selected.value)
const selectedBar = computed(() => {
  const year = activeYear.value ?? defaultYear.value
  return chart.value?.bars.find((bar) => bar.year === year) ?? null
})

function selectBar(year: number) {
  selected.value = year
  hovered.value = null
}

function move(delta: number) {
  const bars = chart.value?.bars ?? []
  const current = bars.findIndex((bar) => bar.year === (selected.value ?? defaultYear.value))
  const next = bars[Math.min(Math.max(current + delta, 0), bars.length - 1)]
  if (next) selectBar(next.year)
}

function openSelected() {
  const bar = selectedBar.value
  if (bar && props.literature) window.open(pubmedUrl(props.literature.query, bar.year), '_blank', 'noopener')
}

const typesOf = (types: StudyType[]) => types.flatMap((type) => STUDY_TYPES[type] ?? []).slice(0, 2)

/* Trials */
const PREVIEW = 4
const PAGE = 20
const status = ref('')
const loaded = ref<ClinicalTrial[]>([...(props.trials?.items ?? [])])
const matching = ref(props.trials?.total ?? 0)
const limit = ref(PREVIEW)
const loading = ref(false)
const failed = ref(false)
let request = 0

const statusTotal = computed(() => props.trials?.byStatus.reduce((sum, item) => sum + item.count, 0) || 1)
const statusSummary = computed(() => (props.trials?.byStatus ?? []).map((item) => `${trialStatus(item.status).label}: ${item.count}`).join(', '))
const shown = computed(() => loaded.value.slice(0, limit.value))

/** Statuses whose completion date is in the past, not a forecast. */
const ENDED = new Set(['COMPLETED', 'TERMINATED', 'WITHDRAWN'])
const opened = ref<string[]>([])
const isOpen = (nctId: string) => opened.value.includes(nctId)
function toggleTrial(nctId: string) {
  opened.value = isOpen(nctId) ? opened.value.filter((id) => id !== nctId) : [...opened.value, nctId]
}
const expanded = computed(() => limit.value > PREVIEW)

async function fetchTrials(offset: number): Promise<Page<ClinicalTrial> | null> {
  const id = ++request
  loading.value = true
  failed.value = false
  try {
    const page = await $fetch<Page<ClinicalTrial>>(`/api/plant-data/${props.slug}/trials`, {
      query: { offset, limit: PAGE, ...(status.value ? { status: status.value } : {}) },
    })
    return id === request ? page : null
  } catch {
    if (id === request) failed.value = true
    return null
  } finally {
    if (id === request) loading.value = false
  }
}

async function showMore() {
  const target = limit.value + PAGE
  if (loaded.value.length < Math.min(target, matching.value)) {
    const page = await fetchTrials(loaded.value.length)
    if (!page) return
    loaded.value = [...loaded.value, ...page.items]
    matching.value = page.total
  }
  limit.value = target
}

function collapse() {
  limit.value = PREVIEW
  document.getElementById(TRIALS_ANCHOR)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function setStatus(value: string) {
  status.value = value
  limit.value = PREVIEW
  if (!value) {
    request++
    loading.value = false
    failed.value = false
    loaded.value = [...(props.trials?.items ?? [])]
    matching.value = props.trials?.total ?? 0
    return
  }
  const count = props.trials?.byStatus.find((item) => item.status === value)?.count ?? 0
  const page = await fetchTrials(0)
  if (!page) {
    loaded.value = []
    matching.value = count
    return
  }
  loaded.value = page.items
  matching.value = page.total
}

const toggleStatus = (value: string) => setStatus(status.value === value ? '' : value)

watch(() => props.slug, () => {
  hovered.value = null
  selected.value = null
  opened.value = []
  void setStatus('')
})
</script>
