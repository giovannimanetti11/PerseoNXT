<template>
  <NumberedSection heading="Interazioni con farmaci" :number="number" :extra-class="`${width} post-section-interazioni`">
    <div class="mt-4 md:mt-8">
      <div v-if="isEma" class="flex flex-wrap items-center gap-3 mb-4">
        <span class="text-xs font-medium px-3 py-1 rounded-full bg-verde text-white">Fonte: EMA HMPC</span>
        <a
          v-if="interactions.emaMonografiaUrl"
          :href="interactions.emaMonografiaUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs font-medium px-3 py-1 rounded-full bg-blu text-white hover:bg-celeste transition-colors"
        >
          Documento EMA (PDF)
        </a>
        <a
          v-if="interactions.emaPageUrl"
          :href="interactions.emaPageUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs font-medium px-3 py-1 rounded-full border border-blu text-blu hover:bg-blu hover:text-white transition-colors"
        >
          Pagina EMA
        </a>
      </div>
      <div v-else-if="interactions.source === 'drugscom'" class="flex flex-wrap items-center gap-3 mb-4">
        <a
          v-if="interactions.drugscomUrl"
          :href="interactions.drugscomUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs font-medium px-3 py-1 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
        >
          Fonte: Drugs.com
        </a>
        <span v-else class="text-xs font-medium px-3 py-1 rounded-full bg-gray-200 text-gray-700">Fonte: Drugs.com</span>
      </div>

      <div class="bg-white rounded-xl p-4 md:p-6 text-sm leading-relaxed text-gray-700 whitespace-pre-line">{{ interactions.text }}</div>

      <p class="mt-4 text-xs text-gray-500 italic">
        Queste informazioni non sostituiscono il parere del medico o del farmacista: chiedi a loro prima di associare un rimedio fitoterapico a un farmaco.
      </p>
    </div>
  </NumberedSection>
</template>

<script setup lang="ts">
import type { DrugInteractions } from '#shared/types/content'

const props = withDefaults(defineProps<{
  interactions: DrugInteractions
  number: number
  /** Width classes of the section. */
  width?: string
}>(), { width: 'w-11/12' })

const isEma = computed(() => props.interactions.source === 'ema_assessment' || props.interactions.source === 'ema_monograph')
</script>
