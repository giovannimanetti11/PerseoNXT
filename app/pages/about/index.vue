<template>
  <section class="soft-gradient py-14 w-11/12 m-auto rounded-2xl">
    <div class="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
      <LoadingSpinner v-if="pending" />

      <ErrorState
        v-else-if="error"
        type="error"
        title="Pagina non disponibile"
        message="Impossibile caricare le informazioni. Prova a ricaricare la pagina."
      />

      <template v-else>
        <div class="mb-9 mt-16 text-center sm:mb-12 sm:mt-20">
          <p class="mb-3 text-xs font-bold uppercase tracking-widest text-blu sm:text-sm">Chi siamo</p>
          <h1 class="text-3xl font-bold leading-tight text-gray-900 sm:text-5xl">Il progetto Wikiherbalist</h1>
        </div>

        <div
          class="about-content mx-auto max-w-5xl text-base leading-7 text-gray-700 sm:text-lg sm:leading-8"
          v-html="aboutContent"
        ></div>

        <section v-if="members.length > 0" class="mt-12 border-t border-blu/15 pt-10 sm:mt-16 sm:pt-12" aria-labelledby="staff-title">
          <div class="mb-8 text-center sm:mb-10">
            <h2 id="staff-title" class="text-3xl font-bold text-gray-900 sm:text-4xl">Staff</h2>
            <p class="mt-3 text-base text-gray-600">Le persone che contribuiscono al progetto</p>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            <article
              v-for="member in members"
              :key="member.id"
              class="rounded-2xl border border-blu/15 bg-blu/5 p-5 transition-colors duration-200 hover:border-verde/40 sm:p-6"
            >
              <div class="mx-auto mb-5 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-blu/10 sm:h-36 sm:w-36">
                <NuxtImg
                  v-if="member.featuredImage?.node?.sourceUrl"
                  :src="member.featuredImage.node.sourceUrl"
                  :alt="member.title"
                  class="h-full w-full object-cover"
                  width="144"
                  height="144"
                  loading="lazy"
                />
                <div v-else class="flex h-full w-full items-center justify-center bg-blu/10 text-blu">
                  <span class="text-3xl font-semibold sm:text-4xl">{{ getInitials(member.title) }}</span>
                </div>
              </div>
              <h3 class="mb-2 text-center text-lg font-bold leading-snug text-blu sm:text-xl">{{ member.title }}</h3>
              <p v-if="member.affiliation" class="text-center text-sm leading-relaxed text-gray-700">{{ member.affiliation }}</p>
              <div v-if="member.content" class="mt-4 border-t border-blu/10 pt-4 text-center text-sm leading-relaxed text-gray-700" v-html="sanitizeHtml(member.content)"></div>
            </article>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>


<script setup lang="ts">
import type { WpConnection, WpImageEdge } from '#shared/types/wordpress'

interface Member {
  id: string
  title: string
  content: string | null
  affiliation: string | null
  featuredImage: WpImageEdge | null
}

interface AboutData {
  pageBy: { content: string | null } | null
  members: WpConnection<Member>
}

const ABOUT_QUERY = `
  query About {
    pageBy(uri: "about") { content }
    members(first: 100) {
      nodes { id title content affiliation featuredImage { node { sourceUrl } } }
    }
  }
`

const { query } = useGraphQL()
const { data, pending, error } = await useAsyncData('about', () => query<AboutData>(ABOUT_QUERY))

const aboutContent = computed(() => sanitizeHtml(data.value?.pageBy?.content))
// WordPress returns the newest member first; the page lists founders first.
const members = computed(() => [...(data.value?.members.nodes ?? [])].reverse())

const getInitials = (name: string): string =>
  name.split(' ').map((word) => word.charAt(0)).join('').toUpperCase().slice(0, 2)

const description = 'Il progetto Wikiherbalist: chi lo cura, come lavora la redazione e lo staff che scrive e revisiona le schede sulle piante medicinali.'
useSeoMeta({
  title: 'About',
  description,
  ogTitle: 'About | Wikiherbalist',
  ogDescription: description,
  twitterTitle: 'About | Wikiherbalist',
  twitterDescription: description,
})
</script>

<style scoped>
.about-content :deep(h2),
.about-content :deep(h3),
.about-content :deep(h4) {
  color: #036297;
  font-weight: 700;
  line-height: 1.4;
  margin: 1.5rem 0 0.65rem;
}

.about-content :deep(p) {
  margin: 0 0 1rem;
}

.about-content :deep(a) {
  color: #036297;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.about-content :deep(a:hover) {
  color: #0DA6A4;
}

.about-content :deep(ul),
.about-content :deep(ol) {
  margin: 0.75rem 0 1.25rem;
  padding-left: 1.25rem;
}

.about-content :deep(ul) {
  list-style: disc;
}

.about-content :deep(ol) {
  list-style: decimal;
}
</style>
