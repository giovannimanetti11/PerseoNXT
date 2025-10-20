<template>
  <div>
    <h1 class="sr-only">Wikiherbalist - Enciclopedia di erbe aromatiche e medicinali</h1>
    <Hero />
    <Searchfield v-if="currentView === 'monographs'" />
    <SearchProperty v-else @search="handleSearch" />
    <BrowseContent @viewChange="handleViewChange" :currentView="currentView" :searchTerm="searchTerm" />
    <LazySectionBlog />
    <LazyContacts />
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'
import Hero from '~/components/hero.vue'
import Searchfield from '~/components/searchfield.vue'
import SearchProperty from '~/components/searchProperty.vue'
import BrowseContent from '~/components/browseContent.vue'

// Use defineAsyncComponent for lazy-loaded components
const LazySectionBlog = defineAsyncComponent(() => import('~/components/section-blog.vue'))
const LazyContacts = defineAsyncComponent(() => import('~/components/contacts.vue'))

const currentView = ref('monographs')
const searchTerm = ref('')

const handleViewChange = (view) => {
  currentView.value = view
  if (view === 'monographs') {
    searchTerm.value = ''
  }
}

const handleSearch = (term) => {
  searchTerm.value = term
}

useHead({
  title: 'Wikiherbalist - Enciclopedia di erbe aromatiche e medicinali',
  titleTemplate: title => title || 'Home | Wikiherbalist',
  meta: [
    { 
      name: 'description', 
      content: 'Scopri proprietà, usi e benefici delle piante medicinali attraverso monografie dettagliate, glossario e articoli informativi.' 
    },
    {
      property: 'og:title',
      content: 'Wikiherbalist - Enciclopedia di erbe aromatiche e medicinali'
    },
    {
      property: 'og:description',
      content: 'Scopri proprietà, usi e benefici delle piante medicinali attraverso monografie dettagliate, glossario e articoli informativi.'
    },
    {
      name: 'twitter:title',
      content: 'Wikiherbalist - Enciclopedia di erbe aromatiche e medicinali'
    }
  ]
})
</script>