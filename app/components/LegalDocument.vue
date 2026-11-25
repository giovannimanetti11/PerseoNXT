<template>
  <section class="soft-gradient py-14 w-11/12 m-auto rounded-2xl">
    <div class="px-5 sm:px-10">
      <h1 class="text-4xl font-bold mt-12 mb-8 text-center text-blu">{{ title }}</h1>
      <p class="text-sm text-gray-600 mb-6">Ultimo aggiornamento: {{ updated }}</p>

      <div class="space-y-8">
        <section v-for="(section, index) in sections" :key="section.title">
          <h2 class="text-2xl font-semibold mb-4 text-verde">{{ index + 1 }}. {{ section.title }}</h2>
          <!-- Static, trusted markup written in this repository -->
          <div class="legal-text max-w-none overflow-x-auto" v-html="section.content"></div>
        </section>
      </div>

      <div class="mt-12 pt-8 border-t border-gray-200">
        <h2 class="text-2xl font-semibold mb-4 text-verde">{{ sections.length + 1 }}. Contatti</h2>
        <p>
          Per domande su questo documento scrivi a
          <a href="mailto:info@wikiherbalist.com" class="text-blu hover:underline">info@wikiherbalist.com</a>.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface LegalSection {
  title: string
  content: string
}

const props = defineProps<{
  title: string
  /** Date of the last change to the text, e.g. "novembre 2024" */
  updated: string
  description: string
  sections: LegalSection[]
}>()

useSeoMeta({
  title: props.title,
  description: props.description,
})
</script>
