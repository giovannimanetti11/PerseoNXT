<template>
  <section class="soft-gradient py-14 w-11/12 m-auto rounded-2xl">
    <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Piante medicinali</h1>
    <SiteSearch />
    <LoadingSpinner v-if="pending" />
    <ErrorState v-else-if="error" title="Impossibile caricare le piante" message="L'elenco delle piante non è disponibile in questo momento. Ricarica la pagina tra poco." />
    <div v-else-if="groups.length" class="flex justify-center mt-14">
      <div class="grid grid-cols-1 px-2 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <div v-for="group in groups" :key="group.letter" class="mb-6 flex flex-row ml-4 md:ml-0">
          <div class="letter-heading flex items-center justify-center text-xl font-bold w-16 h-16 min-w-16 min-h-16 rounded-full bg-celeste text-white">{{ group.letter }}</div>
          <ul class="ml-4 flex flex-col flex-wrap gap-4">
            <li v-for="entry in group.entries" :key="entry.path" class="flex flex-row">
              <NuxtLink :to="entry.path" class="text-black hover:text-blu">
                <h2>{{ entry.title }}</h2>
                <h3 class="italic">{{ entry.subtitle }}</h3>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <ErrorState v-else type="empty" title="Nessuna pianta trovata" message="L'elenco è vuoto." :show-retry="false" :show-contact="false" />
  </section>
  <ContactSection />
</template>

<script setup lang="ts">
import type { WpConnection } from '#shared/types/wordpress'

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

const entries = computed(() => (plants.value ?? []).map((plant) => ({
  title: decodeEntities(plant.title),
  subtitle: plant.nomeScientifico ?? '',
  path: contentPath('plant', plant.slug),
})))

const groups = computed(() => groupByInitial(entries.value, true))

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
