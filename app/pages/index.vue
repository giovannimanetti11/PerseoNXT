<template>
  <div>
    <HomeHero />
    <SiteSearch v-if="view === 'monographs'" />
    <PropertySearch v-else v-model="propertyTerm" />
    <BrowseContent v-model:view="view" :search-term="propertyTerm" />
    <LazyHomeBlog />
    <LazyContactSection />
  </div>
</template>

<script setup lang="ts">
import type { BrowseView } from '~/components/BrowseContent.vue'

const view = ref<BrowseView>('monographs')
const propertyTerm = ref('')

watch(view, () => { propertyTerm.value = '' })

const title = 'Wikiherbalist - Enciclopedia di erbe aromatiche e medicinali'
const description = 'Proprietà, usi e controindicazioni delle piante medicinali: monografie, glossario e articoli con le fonti scientifiche.'

useSeoMeta({
  title,
  titleTemplate: null,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterTitle: title,
  twitterDescription: description,
})

// The WebSite node (#website) comes from nuxt-schema-org on every page.
</script>
