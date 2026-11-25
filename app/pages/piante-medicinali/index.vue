<template>
  <section class="soft-gradient py-14 w-11/12 m-auto rounded-2xl">
    <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Piante medicinali</h1>
    <SiteSearch />
    <LoadingSpinner v-if="pending" />
    <ErrorState v-else-if="error" title="Impossibile caricare le piante" message="L'elenco delle piante non è disponibile in questo momento. Ricarica la pagina tra poco." />
    <LetterIndex v-else-if="entries.length" :entries="entries" />
    <ErrorState v-else type="empty" title="Nessuna pianta trovata" message="L'elenco è vuoto." :show-retry="false" :show-contact="false" />
  </section>
  <ContactSection />
</template>

<script setup lang="ts">
import type { WpConnection } from '#shared/types/wordpress'
import type { IndexEntry } from '~/components/LetterIndex.vue'

interface PlantNode {
  title: string
  slug: string
  nomeScientifico: string | null
}

const ALL_PLANTS = `
  query AllPlants {
    posts(first: 500, where: { status: PUBLISH }) { nodes { title slug nomeScientifico } }
  }
`

const { query } = useGraphQL()

const { data: plants, pending, error } = await useAsyncData('all-plants', async () => {
  const { posts } = await query<{ posts: WpConnection<PlantNode> }>(ALL_PLANTS)
  return posts.nodes
})

const entries = computed<IndexEntry[]>(() => (plants.value ?? []).map((plant) => ({
  title: decodeEntities(plant.title),
  subtitle: plant.nomeScientifico ?? '',
  path: contentPath('plant', plant.slug),
})))

const description = 'Elenco delle piante medicinali e aromatiche di Wikiherbalist: schede con proprietà, usi, botanica e ricerca scientifica.'

useSeoMeta({
  title: 'Piante medicinali',
  description,
  ogTitle: 'Piante medicinali | Wikiherbalist',
  ogDescription: description,
  twitterTitle: 'Piante medicinali | Wikiherbalist',
  twitterDescription: description,
})

useHead(() => ({
  script: entries.value.length
    ? [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Piante medicinali di Wikiherbalist',
          url: `${SITE_URL}/piante-medicinali`,
          numberOfItems: entries.value.length,
          itemListElement: entries.value.map((entry, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: entry.title,
            url: `${SITE_URL}${entry.path}`,
          })),
        }),
      }]
    : [],
}))
</script>
