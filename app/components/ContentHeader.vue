<template>
  <div class="flex flex-col relative">
    <div class="flex flex-row items-center gap-2">
      <h1 class="text-3xl font-bold">{{ title }}</h1>
      <slot name="badge" />
      <button
        v-if="speakable"
        type="button"
        class="flex shadow text-white bg-blu rounded-full w-6 h-6 justify-center items-center hover:bg-white hover:text-blu print:hidden"
        aria-label="Ascolta la pronuncia del nome"
        @click="speak"
      >
        <Icon name="f7:speaker-1-fill" class="text-xl" />
      </button>
    </div>
    <slot />

    <ContentActions :title="title" :author="author" :published="published" />

    <p class="mt-4 text-xs text-gray-500">
      <template v-if="kind === 'blog'">Articolo pubblicato il {{ date(published) }}</template>
      <template v-else>
        Scheda pubblicata il {{ date(published) }}<template v-if="isDifferentDay(published, modified)"> e {{ kind === 'plant' ? 'modificata' : 'aggiornata' }} il {{ date(modified) }}</template>
      </template>
    </p>
    <p class="text-xs text-gray-500 mt-2">Di: {{ author }}</p>
    <p class="flex items-center mt-2 text-xs text-gray-500">
      <Icon name="ph:clock-fill" class="text-sm text-gray-600 mr-1.5" />
      Tempo di lettura: {{ readingTime }} min
    </p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  author: string
  published: string
  modified?: string
  readingTime: number
  kind: 'plant' | 'glossary' | 'blog'
  speakable?: boolean
}>(), { modified: '', speakable: false })

const date = (value: string) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? 'data non disponibile'
    : parsed.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
}

function speak() {
  if (!('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance(props.title)
  utterance.lang = 'it-IT'
  window.speechSynthesis.speak(utterance)
}
</script>
