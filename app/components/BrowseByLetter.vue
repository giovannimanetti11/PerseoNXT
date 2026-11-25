<template>
  <section class="py-2 w-11/12 mx-auto rounded-2xl alphabet-section">
    <div class="container mx-auto px-0 md:px-4 mt-4">
      <AlphabetNav v-model="selectedLetter" />

      <div aria-live="polite" class="text-center mt-4">
        <p v-if="!pending && plants.length > 0">
          {{ plants.length }} {{ plants.length === 1 ? 'erba' : 'erbe' }} che inizia{{ plants.length === 1 ? '' : 'no' }} per {{ selectedLetter }}
        </p>
        <p v-else-if="!pending && plants.length === 0">
          Nessun risultato trovato per la lettera {{ selectedLetter }}
        </p>
      </div>

      <div v-if="pending" class="w-full h-64 flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
      </div>

      <div v-else class="w-full mx-auto flex overflow-x-auto mt-10 gap-4 px-4 pb-6 posts-container" style="scroll-padding-right: 30px;">
        <NuxtLink
          v-for="post in plants"
          :key="post.slug"
          :to="`/${post.slug}`"
          class="card flex-none w-56 sm:w-64 h-auto p-3 bg-white rounded-2xl shadow transition-all hover:scale-105 hover:shadow-md hover:cursor-pointer"
        >
          <img
            :src="post.image || '/media/default-og-image.jpg'"
            :alt="post.imageAlt || post.title"
            class="w-full h-28 sm:h-32 object-cover rounded-lg"
            width="240"
            height="128"
            loading="lazy"
          >
          <h2 class="mt-4 font-bold text-sm sm:text-base">{{ post.title }}</h2>
          <h3 class="italic text-gray-400 text-xs sm:text-sm">{{ post.nomeScientifico }}</h3>
        </NuxtLink>
      </div>
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
const selectedLetter = ref('A')

const { data: allPlants, pending } = await useAsyncData('browse-plants', async (): Promise<PlantCard[]> => {
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

const plants = computed(() => (allPlants.value ?? []).filter((plant) => initialLetter(plant.title) === selectedLetter.value))
</script>

<style scoped>
.alphabet-section {
  background: rgb(224,237,253);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
}

.posts-container {
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.posts-container > div {
  scroll-snap-align: start;
}

@media (max-width: 374px) {
  .posts-container {
    padding-right: 20%;
  }
  
  .card {
    width: 85%;
    max-width: 240px;
  }
  
  .card h2 {
    font-size: 0.875rem;
  }
  
  .card h3 {
    font-size: 0.75rem;
  }
}

@media (min-width: 375px) and (max-width: 639px) {
  .posts-container {
    padding-right: 15%;
  }
  
  .card {
    width: 90%;
    max-width: 260px;
  }
}
</style>