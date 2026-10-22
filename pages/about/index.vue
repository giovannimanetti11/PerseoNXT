<template>
  <section class="wiki-reference-gradient py-14 w-11/12 m-auto rounded-2xl">
    <div class="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
      <div v-if="pending" class="flex h-64 items-center justify-center" role="status">
        <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blu"></div>
        <span class="sr-only">Caricamento in corso...</span>
      </div>

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
          v-html="formattedAboutContent"
          class="about-content mx-auto max-w-5xl text-base leading-7 text-gray-700 sm:text-lg sm:leading-8"
        ></div>

        <section v-if="members.length > 0" class="mt-12 border-t border-blu/15 pt-10 sm:mt-16 sm:pt-12" aria-labelledby="staff-title">
          <div class="mb-8 text-center sm:mb-10">
            <h2 id="staff-title" class="text-3xl font-bold text-gray-900 sm:text-4xl">Staff</h2>
            <p class="mt-3 text-base text-gray-600">Le persone che contribuiscono al progetto</p>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            <article
              v-for="member in reversedMembers"
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
              <div v-if="member.content" v-html="formatContent(member.content)" class="mt-4 border-t border-blu/10 pt-4 text-center text-sm leading-relaxed text-gray-700"></div>
            </article>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { useAsyncData } from '#app'
import { useGraphQL } from '~/composables/useGraphQL'
import DOMPurify from 'isomorphic-dompurify'

interface Member {
  id: string
  databaseId: number
  title: string
  content: string
  affiliation: string
  featuredImage?: {
    node: {
      sourceUrl: string
    }
  }
  memberCategories?: {
    nodes: {
      name: string
    }[]
  }
}

interface AboutData {
  pageBy: {
    content: string
  }
  members: {
    nodes: Member[]
  }
}

const FETCH_ABOUT_DATA = `
  query FetchAboutData {
    pageBy(uri: "about") {
      content
    }
    members {
      nodes {
        id
        databaseId
        title
        content
        affiliation
        featuredImage {
          node {
            sourceUrl
          }
        }
        memberCategories {
          nodes {
            name
          }
        }
      }
    }
  }
`

const { query } = useGraphQL()

const { data: aboutData, pending, error } = await useAsyncData<AboutData>('aboutData', async () => {
  const data = await query(FETCH_ABOUT_DATA)
  return data
}, {
  server: true,  // Force SSR only - prevents client-side refetch
  lazy: false
})

const aboutContent = computed(() => aboutData.value?.pageBy?.content || '')
const members = computed(() => aboutData.value?.members?.nodes || [])

const formattedAboutContent = computed(() => formatContent(aboutContent.value))

const reversedMembers = computed(() => [...members.value].reverse())

const formatContent = (content: string): string => {
  if (!content) return ''
  
  // Sanitize first
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class']
  })
  
  // Use a regular expression to add classes
  const formatted = sanitized.replace(/<(h[1-6]|ul|ol|li|a)([^>]*)>/g, (match, tag, attributes) => {
    let classes = ''
    switch (tag) {
      case 'h1':
        classes = 'text-3xl font-bold mt-6 mb-4'
        break
      case 'h2':
        classes = 'text-2xl font-bold mt-6 mb-4'
        break
      case 'h3':
        classes = 'text-xl font-bold mt-6 mb-4'
        break
      case 'h4':
        classes = 'text-lg font-bold mt-6 mb-4'
        break
      case 'ul':
        classes = 'list-disc list-inside my-4 pl-4'
        break
      case 'ol':
        classes = 'list-decimal list-inside my-4 pl-4'
        break
      case 'li':
        classes = 'mb-2'
        break
      case 'a':
        classes = 'text-blu hover:text-celeste underline'
        break
    }
    return `<${tag}${attributes} class="${classes}">`
  })

  return formatted
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

useHead({
  title: 'About'
})

useSeoMeta({
  description: 'Scopri il progetto Wikiherbalist: chi siamo, la nostra missione e il team che cura l\'enciclopedia online di erbe medicinali e aromatiche.',
  ogTitle: 'About | Wikiherbalist',
  ogDescription: 'Scopri il progetto Wikiherbalist: chi siamo, la nostra missione e il team che cura l\'enciclopedia online di erbe medicinali e aromatiche.',
  ogUrl: 'https://wikiherbalist.com/about',
  twitterTitle: 'About | Wikiherbalist',
  twitterDescription: 'Scopri il progetto Wikiherbalist: chi siamo, la nostra missione e il team dedicato alle erbe medicinali.',
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
}
</style>
