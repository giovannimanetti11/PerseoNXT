<template>
  <section class="py-10 mt-6 w-11/12 mx-auto rounded-2xl bg-gradient-to-b from-[#f5f5f5] to-[#e0edfd]">
    <div class="flex flex-col xl:flex-row">
      <div class="w-full xl:w-2/5 p-8 xl:ml-6">
        <h2 class="text-3xl font-bold mb-4">Blog</h2>
        <p class="mb-6">
          Articoli di approfondimento su singole piante, principi attivi e integratori,
          con i riferimenti agli studi citati.
        </p>
        <NuxtLink to="/blog" class="inline-block text-blu py-2 px-4 border border-blu rounded-xl hover:text-verde hover:border-verde transition-colors duration-300">
          Vai al blog
        </NuxtLink>
      </div>

      <div class="w-full xl:w-3/5 xl:relative xl:h-[625px]">
        <LoadingSpinner v-if="pending" height="h-full" />
        <ErrorState v-else-if="error" title="Blog non disponibile" message="Gli articoli non sono raggiungibili in questo momento." :show-contact="false" />
        <div v-else class="w-full flex flex-col xl:absolute xl:inset-0">
          <article
            v-for="(post, index) in posts"
            :key="post.slug"
            :class="[
              'blog-card w-11/12 xl:w-7/12 flex flex-col xl:flex-row rounded-2xl shadow m-auto my-2 xl:m-0 xl:absolute group',
              active === post.slug ? 'xl:z-10 bg-celeste text-white' : 'bg-white md:hover:bg-celeste md:hover:text-white',
            ]"
            :style="{ '--offset-x': `${offsetX(index)}px`, '--offset-y': `${index * 100}px` }"
            @mouseenter="active = post.slug"
          >
            <div class="px-6 py-4 flex flex-col justify-between items-start w-full xl:w-1/2">
              <h3 class="font-bold text-xl mb-auto">{{ post.title }}</h3>
              <p class="blog-details text-gray-500 group-hover:text-white" :class="{ 'text-white': active === post.slug }">{{ post.authorName }}</p>
              <p class="blog-details text-gray-500 group-hover:text-white" :class="{ 'text-white': active === post.slug }">{{ formatItalianDate(post.date) }}</p>
            </div>
            <div class="w-full xl:w-1/2 m-auto text-center">
              <img
                v-if="post.image"
                :src="post.image"
                :alt="post.imageAlt || post.title"
                class="rounded-2xl w-11/12 mt-4 m-auto h-auto max-h-32 object-cover"
                width="300"
                height="200"
                loading="lazy"
              >
              <NuxtLink
                :to="`/blog/${post.slug}`"
                :class="[
                  'block w-11/12 mt-4 mb-4 mx-auto py-4 rounded-xl transition-colors duration-300',
                  active === post.slug ? 'bg-white text-celeste hover:bg-blu hover:text-white' : 'bg-verde text-white hover:bg-blu',
                ]"
              >
                Leggi l'articolo <span aria-hidden="true">→</span>
              </NuxtLink>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { WpConnection, WpImageEdge } from '#shared/types/wordpress'

interface BlogNode {
  slug: string
  title: string
  date: string
  authorName: string | null
  featuredImage: WpImageEdge | null
}

const LATEST_POSTS_QUERY = `
  query LatestBlogPosts {
    blogPosts(first: 3, where: { orderby: { field: DATE, order: DESC } }) {
      nodes { slug title date authorName featuredImage { node { sourceUrl(size: MEDIUM) altText } } }
    }
  }
`

const { query } = useGraphQL()
const active = ref<string | null>(null)

// Below the fold: fetched in the browser so it does not delay the first paint.
const { data, pending, error } = useLazyAsyncData('home-latest-posts', async () => {
  const { blogPosts } = await query<{ blogPosts: WpConnection<BlogNode> }>(LATEST_POSTS_QUERY)
  return blogPosts.nodes.map((post) => ({
    slug: post.slug,
    title: decodeEntities(post.title),
    date: post.date,
    authorName: displayAuthorName(post.authorName),
    image: post.featuredImage?.node?.sourceUrl ?? '',
    imageAlt: post.featuredImage?.node?.altText ?? '',
  }))
}, { server: false })

// Oldest at the top of the stack, the newest one in front.
const posts = computed(() => [...(data.value ?? [])].reverse())

// Cards fan out diagonally on wide screens; the hovered one moves right.
const BASE_OFFSETS = [240, 120, 290]
const offsetX = (index: number) => {
  const base = BASE_OFFSETS[index] ?? 0
  if (!active.value) return base
  return posts.value[index]?.slug === active.value ? base + 100 : base - 100
}
</script>

<style scoped>
@media (min-width: 1280px) {
  .blog-card {
    transform: translate(var(--offset-x), var(--offset-y));
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s;
  }
}
</style>
