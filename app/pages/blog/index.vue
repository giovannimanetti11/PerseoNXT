<template>
  <section class="blog-page-section mx-auto w-11/12 rounded-2xl py-14">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <h1 class="mb-8 mt-8 py-3 text-center text-4xl font-bold text-black sm:mb-10 sm:mt-12 sm:py-4 sm:text-5xl">Blog</h1>
      <SiteSearch />
      <div ref="articlesAnchor" class="scroll-mt-24" aria-hidden="true"></div>

      <div v-if="pending" class="flex h-64 w-full items-center justify-center" role="status" aria-live="polite">
        <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blu"></div>
        <span class="sr-only">Caricamento in corso...</span>
      </div>

      <ErrorState
        v-else-if="error"
        type="error"
        title="Impossibile caricare il blog"
        message="Si è verificato un problema nel recuperare gli articoli. Prova a ricaricare la pagina."
      />

      <template v-else-if="pageData">
        <article v-if="featuredPost" class="blog-card-surface mt-8 overflow-hidden sm:mt-14 rounded-2xl border border-transparent bg-white shadow-md">
          <NuxtLink :to="postUrl(featuredPost)" class="flex flex-col md:flex-row focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blu">
            <div class="w-full bg-ghiaccio md:w-5/12">
              <NuxtImg
                v-if="featuredPost.featuredImage?.node?.sourceUrl"
                :src="featuredPost.featuredImage.node.sourceUrl"
                :alt="featuredPost.featuredImage.node.altText || featuredPost.title"
                class="blog-card-image h-52 w-full object-cover sm:h-64 md:h-full md:min-h-80"
                width="640"
                height="400"
                loading="eager"
              />
              <div v-else class="flex h-64 items-center justify-center text-xl font-semibold text-blu md:h-full">Wikiherbalist</div>
            </div>
            <div class="flex w-full flex-col justify-center p-6 sm:p-8 md:w-7/12">
              <p class="mb-3 text-sm font-bold uppercase tracking-wider text-blu">Ultimo articolo</p>
              <h2 class="mb-3 text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
                {{ featuredPost.title }}
              </h2>
              <p class="mb-4 text-sm text-gray-500">
                {{ featuredPost.authorName }} · <time :datetime="featuredPost.date">{{ formatDate(featuredPost.date) }}</time>
              </p>
              <p class="mb-6 line-clamp-4 text-base leading-relaxed text-gray-700">
                {{ plainBlogExcerpt(featuredPost.excerpt) }}
              </p>
              <span class="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-verde bg-verde px-6 py-2.5 text-center font-semibold text-white sm:w-fit">
                Leggi di più <span aria-hidden="true" class="ml-2">→</span>
              </span>
            </div>
          </NuxtLink>
        </article>

        <div v-if="otherPosts.length" class="mt-7 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <article
            v-for="post in otherPosts"
            :key="post.databaseId"
            class="blog-card-surface overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <NuxtLink :to="postUrl(post)" class="flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blu">
              <NuxtImg
                v-if="post.featuredImage?.node?.sourceUrl"
                :src="post.featuredImage.node.sourceUrl"
                :alt="post.featuredImage.node.altText || post.title"
                class="blog-card-image h-44 w-full object-cover sm:h-48"
                width="480"
                height="288"
                loading="lazy"
              />
              <div v-else class="flex h-48 items-center justify-center bg-ghiaccio font-semibold text-blu">Wikiherbalist</div>
              <div class="flex flex-1 flex-col p-5">
                <h2 class="mb-3 line-clamp-3 text-xl font-bold leading-snug text-gray-900 ">
                  {{ post.title }}
                </h2>
                <p class="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-700">
                  {{ plainBlogExcerpt(post.excerpt) }}
                </p>
                <div class="mt-auto">
                  <p class="mb-4 text-sm text-gray-500">
                    {{ post.authorName }} · <time :datetime="post.date">{{ formatDate(post.date) }}</time>
                  </p>
                  <span class="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-verde bg-verde px-5 py-2.5 text-center font-semibold text-white sm:w-fit">
                    Leggi di più <span aria-hidden="true" class="ml-2">→</span>
                  </span>
                </div>
              </div>
            </NuxtLink>
          </article>
        </div>

        <ErrorState
          v-else-if="!featuredPost"
          type="empty"
          title="Nessun articolo disponibile"
          message="Non ci sono ancora articoli pubblicati."
          :show-retry="false"
          :show-contact="false"
        />

        <nav
          v-if="currentPage > 1 || pageData.hasNextPage"
          class="mt-12 flex flex-wrap items-center justify-center gap-2"
          aria-label="Paginazione del blog"
        >
          <NuxtLink
            v-if="currentPage > 1"
            :to="pageUrl(currentPage - 1)"
            rel="prev"
            class="rounded-xl border border-blu bg-white px-4 py-2 text-blu transition-colors hover:bg-blu hover:text-white"
            @click="jumpToArticles"
          >← Precedente</NuxtLink>
          <template v-for="(page, index) in visiblePages" :key="page">
            <span v-if="index > 0 && page - (visiblePages[index - 1] ?? page) > 1" class="px-1 text-gray-500" aria-hidden="true">…</span>
            <NuxtLink
              :to="pageUrl(page)"
              :aria-label="`Vai alla pagina ${page}`"
              :aria-current="page === currentPage ? 'page' : undefined"
              :class="[
                'flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 font-semibold transition-colors',
                page === currentPage
                  ? 'border-blu bg-blu text-white'
                  : 'border-blu bg-white text-blu hover:bg-blu hover:text-white'
              ]"
              @click="jumpToArticles"
            >{{ page }}</NuxtLink>
          </template>
          <NuxtLink
            v-if="pageData.hasNextPage"
            :to="pageUrl(currentPage + 1)"
            rel="next"
            class="rounded-xl border border-blu bg-white px-4 py-2 text-blu transition-colors hover:bg-blu hover:text-white"
            @click="jumpToArticles"
          >Successiva →</NuxtLink>
        </nav>
      </template>
    </div>
  </section>
  <ContactSection />
</template>

<script setup lang="ts">
import type { WpImageEdge } from '#shared/types/wordpress'
import type { BlogConnection } from '#shared/utils/blogPagination'

interface BlogPost {
  title: string
  slug: string
  authorName: string
  date: string
  featuredImage: WpImageEdge | null
  excerpt: string
  databaseId: number
}

const FETCH_BLOG_POSTS = `
  query FetchBlogPosts($first: Int!, $after: String) {
    blogPosts(first: $first, after: $after, where: {orderby: {field: DATE, order: DESC}}) {
      nodes {
        title
        slug
        authorName
        date
        featuredImage {
          node { sourceUrl altText }
        }
        excerpt
        databaseId
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`

const route = useRoute()
const requestedPage = computed(() => parseBlogPage(route.query.page))
if (requestedPage.value === null) {
  throw createError({ statusCode: 404, statusMessage: 'Pagina del blog non valida' })
}
const currentPage = computed(() => requestedPage.value ?? 1)
const { query } = useGraphQL()
const articlesAnchor = ref<HTMLElement | null>(null)

// All posts are loaded once (a few dozen) and paginated locally, so moving
// between ?page=N links needs no request. The cached copy is reused when the
// visitor comes back to the blog during the same session.
const { data: blogPosts, pending, error } = await useAsyncData<BlogPost[]>(
  'blog-index',
  () => loadBlogPosts<BlogPost>(async (first, after) => {
    const response = await query<{ blogPosts: BlogConnection<BlogPost> }>(FETCH_BLOG_POSTS, { first, after })
    return response.blogPosts
  }),
  { getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] },
)

const pageData = computed(() => blogPosts.value ? paginateBlogPosts(blogPosts.value, currentPage.value) : null)

if (import.meta.server && !error.value && blogPosts.value && !pageData.value) {
  throw createError({ statusCode: 404, statusMessage: 'Pagina del blog non trovata' })
}

const featuredPost = computed(() => pageData.value?.featuredPost ?? null)
const otherPosts = computed(() => pageData.value?.otherPosts ?? [])

const jumpToArticles = () => {
  if (!import.meta.client || !articlesAnchor.value) return
  const top = window.scrollY + articlesAnchor.value.getBoundingClientRect().top - 90
  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
}

watch(currentPage, async () => {
  await nextTick()
  jumpToArticles()
}, { flush: 'post' })

const visiblePages = computed(() => {
  const pages = [1, currentPage.value - 1, currentPage.value, pageData.value?.totalPages ?? 1]
  if (pageData.value?.hasNextPage) pages.push(currentPage.value + 1)
  return [...new Set(pages.filter(page => page >= 1))].sort((a, b) => a - b)
})

const pageUrl = (page: number) => page === 1 ? '/blog' : `/blog?page=${page}`
const postUrl = (post: BlogPost) => `/blog/${post.slug}`
const formatDate = (date: string) => formatItalianDate(date)

const description = 'Articoli su piante officinali, principi attivi e integratori, con i riferimenti agli studi citati.'
useSeoMeta({
  title: () => currentPage.value === 1 ? 'Blog' : `Blog - Pagina ${currentPage.value}`,
  description,
  ogTitle: 'Blog | Wikiherbalist',
  ogDescription: description,
  twitterTitle: 'Blog | Wikiherbalist',
  twitterDescription: description,
})
useHead(() => ({
  link: [
    { rel: 'canonical' as const, href: `${SITE_URL}${pageUrl(currentPage.value)}` },
    ...(currentPage.value > 1 ? [{ rel: 'prev' as const, href: `${SITE_URL}${pageUrl(currentPage.value - 1)}` }] : []),
    ...(pageData.value?.hasNextPage ? [{ rel: 'next' as const, href: `${SITE_URL}${pageUrl(currentPage.value + 1)}` }] : []),
  ],
}))
</script>

<style scoped>
.blog-page-section {
  background: linear-gradient(180deg, rgba(224, 237, 253, 1) 0%, rgba(245, 245, 245, 1) 82%);
}

/* Subtle, consistent hover without shifting surrounding layout or recoloring the content. */
.blog-card-surface {
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.blog-card-image {
  transition: transform 320ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .blog-card-surface:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(3, 98, 151, 0.14);
    border-color: rgba(13, 166, 164, 0.35);
  }

  .blog-card-surface:hover .blog-card-image {
    transform: scale(1.025);
  }
}

.blog-card-surface:focus-within {
  border-color: rgba(13, 166, 164, 0.6);
  box-shadow: 0 8px 22px rgba(3, 98, 151, 0.12);
}

@media (prefers-reduced-motion: reduce) {
  .blog-card-surface,
  .blog-card-image {
    transition: none;
  }

  .blog-card-surface:hover,
  .blog-card-surface:hover .blog-card-image {
    transform: none;
  }
}
</style>
