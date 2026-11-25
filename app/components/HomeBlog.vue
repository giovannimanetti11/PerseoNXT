<template>
  <section class="py-10 mt-6 w-11/12 mx-auto rounded-2xl bg-gradient-to-b from-[#f5f5f5] to-[#e0edfd]">
    <div class="flex flex-col xl:flex-row">
      <!-- Left column -->
      <div class="w-full xl:w-2/5 p-8 xl:ml-6">
        <h3 class="text-3xl font-bold mb-4">Blog</h3>
        <p class="mb-6">
          Articoli di approfondimento su singole piante, principi attivi e integratori,
          con i riferimenti agli studi citati.
        </p>
        <NuxtLink to="/blog" class="inline-block bg-transparent text-blu py-2 px-4 border border-blu rounded-xl hover:text-verde hover:border-verde transition-colors duration-300">
          Vai al blog
        </NuxtLink>
      </div>
      <!-- Right column -->
      <div class="w-full xl:w-3/5 xl:relative xl:h-[625px]">
        <LoadingSpinner v-if="pending" height="h-full" />
        <ErrorState
          v-else-if="error"
          type="error"
          title="Blog non disponibile"
          message="Impossibile caricare gli articoli del blog."
          :show-contact="false"
        />
        <div v-else class="w-full flex flex-col xl:absolute xl:inset-0">
          <div
            v-for="(post, index) in posts" :key="post.uri"
            :class="[
              'blog-card w-11/12 xl:w-7/12 flex flex-col xl:flex-row rounded-2xl shadow transition-all duration-500 ease-in-out m-auto my-2 xl:m-0 cursor-pointer',
              'md:hover:bg-celeste md:hover:text-white group',
              { 'xl:z-10 bg-celeste text-white': isXLScreen && post.uri === activePost },
              { 'bg-white': !isXLScreen || post.uri !== activePost },
              'xl:absolute'
            ]"
            :style="getTransformation(post, index)"
            :aria-label="`Post del blog: ${post.title}`"
            role="article"
            @click="toggleActive(post.uri)"
          >
            <div class="px-6 py-4 flex flex-col justify-between items-start h-full w-full xl:w-2/4">
              <h4 class="font-bold text-xl mb-auto" :class="{ 'text-black md:group-hover:text-white': !isXLScreen || post.uri !== activePost }">{{ post.title }}</h4>
              <p :class="['blog-details', { 'text-gray-500 md:group-hover:text-white': !isXLScreen || post.uri !== activePost }]">{{ post.authorName }}</p>
              <p :class="['blog-details', { 'text-gray-500 md:group-hover:text-white': !isXLScreen || post.uri !== activePost }]">{{ formatDate(post.date) }}</p>
            </div>
            <div class="flex-col w-full xl:w-2/4 m-auto text-center">
              <img
                :src="post.featuredImage"
                :alt="post.title"
                class="rounded-2xl w-11/12 mt-4 m-auto h-auto max-h-32 object-cover"
                width="300"
                height="200"
                loading="lazy"
              >
              <NuxtLink
                :to="post.uri"
                :class="[
                  'blog-card-button block w-11/12 mt-4 mb-4 mx-auto py-4 rounded-xl transition-colors duration-300',
                  (isXLScreen && post.uri === activePost) ? 'bg-white text-celeste hover:bg-blu hover:text-white' : 'bg-verde text-white hover:bg-blu'
                ]"
                @click.stop
              >
                Leggi di più  →
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { WpConnection, WpImageEdge } from '#shared/types/wordpress'

interface BlogNode {
  title: string
  uri: string | null
  date: string
  authorName: string | null
  featuredImage: WpImageEdge | null
}

interface BlogPost {
  title: string
  uri: string
  date: string
  authorName: string
  featuredImage: string
}

const BLOG_POSTS_QUERY = `
  query BlogPosts {
    blogPosts(first: 3, where: { orderby: { field: DATE, order: DESC } }) {
      nodes { authorName title uri date featuredImage { node { altText sourceUrl(size: MEDIUM) } } }
    }
  }
`

const { query } = useGraphQL()

// Below the fold: fetched in the browser so it does not delay the first paint.
const { data: blogData, pending, error } = useLazyAsyncData('homepageBlogPosts', async (): Promise<BlogPost[]> => {
  const { blogPosts } = await query<{ blogPosts: WpConnection<BlogNode> }>(BLOG_POSTS_QUERY)
  return blogPosts.nodes
    .filter((post): post is BlogNode & { uri: string } => Boolean(post.uri?.trim()))
    .map((post) => ({
      title: decodeEntities(post.title),
      uri: normalizePath(post.uri),
      date: post.date,
      authorName: displayAuthorName(post.authorName),
      featuredImage: post.featuredImage?.node?.sourceUrl ?? '',
    }))
}, { server: false })

const posts = computed(() => [...(blogData.value ?? [])].reverse())

const activePost = ref<string | null>(null)
const isXLScreen = ref(false)

const REST = { first: 'translate(240px, 0px)', second: 'translate(120px, 100px)', last: 'translate(290px, 200px)' }
const transformations = ref({ ...REST })

const toggleActive = (uri: string) => {
  if (!isXLScreen.value) return
  if (activePost.value === uri) {
    activePost.value = null
    transformations.value = { ...REST }
    return
  }
  activePost.value = uri
  const index = posts.value.findIndex((post) => post.uri === uri)
  transformations.value = {
    first: index === 0 ? 'translate(340px, 0px)' : 'translate(140px, 0px)',
    second: index === 1 ? 'translate(220px, 100px)' : 'translate(20px, 100px)',
    last: index === 2 ? 'translate(390px, 200px)' : 'translate(190px, 200px)',
  }
}

const getTransformation = (_post: BlogPost, index: number): Record<string, string> => {
  if (!isXLScreen.value) return {}
  const transform = [transformations.value.first, transformations.value.second, transformations.value.last][index]
  return transform ? { transform } : {}
}

const updateScreenSize = () => {
  isXLScreen.value = window.innerWidth >= 1280
}

onMounted(() => {
  updateScreenSize()
  window.addEventListener('resize', updateScreenSize)
})

onBeforeUnmount(() => window.removeEventListener('resize', updateScreenSize))

const formatDate = (date: string): string => formatItalianDate(date)
</script>

<style scoped>
@media (min-width: 1280px) {
  .blog-card {
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0s;
  }

  .blog-card:first-child {
    transform: translate(240px, 0px);
  }

  .blog-card:nth-child(2) {
    transform: translate(120px, 100px);
  }

  .blog-card:last-child {
    transform: translate(290px, 200px);
  }

  .blog-card.active {
    z-index: 10;
    animation: bounce 0.5s forwards;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-30px);}
  60% {transform: translateY(-15px);}
}

/* Responsive adjustments */
@media (max-width: 1279px) {
  .blog-card {
    position: static !important;
    transform: none !important;
    margin-bottom: 1rem !important;
  }
  
  .blog-card:last-child {
    margin-bottom: 0 !important;
  }
}
</style>