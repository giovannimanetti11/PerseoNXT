<template>
  <section>
    <AlphabetNav v-model="letter" :available="available" />

    <p class="text-center mt-4" aria-live="polite">
      <template v-if="plants.length">
        {{ plants.length }} {{ plants.length === 1 ? 'pianta inizia' : 'piante iniziano' }} per {{ letter }}
      </template>
      <template v-else-if="!pending">Nessuna pianta per la lettera {{ letter }}</template>
    </p>

    <LoadingSpinner v-if="pending" />
    <ErrorState v-else-if="error" title="Impossibile caricare le piante" :show-contact="false" />
    <div v-else class="w-full mx-auto flex overflow-x-auto mt-10 gap-4 px-4 pb-6 snap-x snap-mandatory">
      <NuxtLink
        v-for="plant in plants"
        :key="plant.slug"
        :to="`/${plant.slug}`"
        class="snap-start flex-none w-56 sm:w-64 p-3 bg-white rounded-2xl shadow transition-transform hover:scale-105 hover:shadow-md"
      >
        <img
          :src="plant.image || '/media/default-og-image.jpg'"
          :alt="plant.imageAlt || plant.title"
          class="w-full h-28 sm:h-32 object-cover rounded-lg"
          width="240"
          height="128"
          loading="lazy"
        >
        <h3 class="mt-4 font-bold text-sm sm:text-base">{{ plant.title }}</h3>
        <p class="italic text-gray-400 text-xs sm:text-sm">{{ plant.nomeScientifico }}</p>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { WpConnection, WpImageEdge } from '#shared/types/wordpress'

interface PlantNode {
  slug: string
  title: string
  nomeScientifico: string | null
  featuredImage: WpImageEdge | null
}

interface PlantCard {
  slug: string
  title: string
  nomeScientifico: string
  image: string
  imageAlt: string
}

// About 80 monographs: one request for all of them, then letters filter locally.
const PLANTS_QUERY = `
  query BrowsePlants {
    posts(first: 500, where: { status: PUBLISH }) {
      nodes { slug title nomeScientifico featuredImage { node { sourceUrl(size: MEDIUM) altText } } }
    }
  }
`

const { query } = useGraphQL()
const letter = ref('A')

const { data: allPlants, pending, error } = await useAsyncData('browse-plants', async (): Promise<PlantCard[]> => {
  const { posts } = await query<{ posts: WpConnection<PlantNode> }>(PLANTS_QUERY)
  return posts.nodes
    .map((node) => ({
      slug: node.slug,
      title: decodeEntities(node.title),
      nomeScientifico: node.nomeScientifico ?? '',
      image: node.featuredImage?.node?.sourceUrl ?? '',
      imageAlt: node.featuredImage?.node?.altText ?? '',
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'it', { sensitivity: 'base' }))
})

const available = computed(() => new Set((allPlants.value ?? []).map((plant) => initialLetter(plant.title))))
const plants = computed(() => (allPlants.value ?? []).filter((plant) => initialLetter(plant.title) === letter.value))
</script>
