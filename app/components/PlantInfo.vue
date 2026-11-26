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
  </ContentHeader>
</template>

<script setup lang="ts">
import type { PlantPage } from '#shared/types/content'

// Classification, synonyms and the PubMed count moved to the taxonomy and research sections.
const props = defineProps<{ plant: PlantPage }>()

const lastRevision = computed(() => props.plant.revisionDates.at(-1) ?? '')
</script>
