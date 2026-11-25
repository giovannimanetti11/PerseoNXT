<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="#0DA6A4" />
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const route = useRoute()

// One canonical per page, derived from the path. Pages with query-dependent
// canonicals (blog pagination) override it with their own useHead.
useHead({
  link: [{ rel: 'canonical', href: () => canonicalUrl(route.path) }],
})

useSeoMeta({
  description: 'Enciclopedia online di erbe aromatiche e medicinali: monografie, glossario e articoli sulle piante officinali.',
  ogUrl: () => canonicalUrl(route.path),
})
</script>
