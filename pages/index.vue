<template>
  <div>
    <h1 class="sr-only">Wikiherbalist - Enciclopedia di erbe aromatiche e medicinali</h1>
    <Hero />
    <Searchfield />
    <BrowseByLetter />
    <Suspense>
      <template #default>
        <LazyTagsPosts />
      </template>
      <template #fallback>
        <div v-if="loading" class="w-full h-64 flex items-center justify-center">
          <Icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste" />
        </div>
      </template>
    </Suspense>
    <LazySectionBlog />
    <LazyContacts />
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import Hero from '~/components/hero.vue'
import Searchfield from '~/components/searchfield.vue'
import BrowseByLetter from '~/components/browse-by-letter.vue'


const LazyTagsPosts = defineAsyncComponent(() => import('~/components/tags-posts.vue'))


</script>