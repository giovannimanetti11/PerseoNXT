<template>
  <div class="flex flex-col relative w-11/12 m-auto -my-4">
    <LoadingSpinner v-if="pending" />

    <ErrorState
      v-else-if="error"
      type="error"
      title="Impossibile caricare le proprietà"
      message="Si è verificato un problema nel recuperare i dati. Prova a ricaricare la pagina."
      :show-contact="false"
    />

    <div v-else>
      <AlphabetNav v-model="letter" size="w-10 h-10 md:w-11 md:h-11 xl:w-12 xl:h-12" />

      <div class="text-center mt-4">
        <p aria-live="polite">{{ summary }}</p>
      </div>

      <div class="mt-8">
        <div v-if="filtered.length > 0" class="mb-6">
          <div class="letter-heading flex items-center justify-center text-xl font-bold w-16 h-16 min-w-16 min-h-16 rounded-full bg-celeste text-white mb-4">
            <span class="m-auto content-center text-white">{{ letter }}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div v-for="tag in visible" :key="tag.id" class="mb-4">
              <h3 class="font-semibold text-lg text-blu mb-2 flex items-center">
                {{ tag.name }}
                <button
                  v-if="tag.description"
                  type="button"
                  class="relative ml-2"
                  :aria-label="`Che cosa significa ${tag.name}`"
                  @click.stop="openTag = openTag?.id === tag.id ? null : tag"
                  @mouseenter="openTag = tag"
                >
                  <Icon name="mdi:information-outline" class="text-celeste cursor-pointer" />
                </button>
              </h3>
              <p class="text-sm">
                <template v-for="(plant, index) in tag.plants" :key="plant.uri">
                  <NuxtLink :to="plant.uri" class="text-black hover:text-blu">{{ plant.title }}</NuxtLink><span v-if="index < tag.plants.length - 1">, </span>
                </template>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="visible.length < filtered.length" class="text-center mt-8">
        <button type="button" class="bg-transparent text-blu py-2 px-4 border border-blu rounded-xl hover:text-verde hover:border-verde" @click="pages++">
          Mostra più proprietà
        </button>
      </div>
    </div>

    <InfoDialog tooltip :open="openTag !== null" :title="openTag?.name ?? ''" @close="openTag = null">
      <div class="font-normal" v-html="sanitizeHtml(openTag?.description)"></div>
    </InfoDialog>
  </div>
</template>

<script setup lang="ts">
import type { WpConnection } from '#shared/types/wordpress'

interface TagNode {
  id: string
  name: string
  description: string | null
  posts: WpConnection<{ title: string; uri: string | null }>
}

interface TagEntry {
  id: string
  name: string
  description: string
  plants: { title: string; uri: string }[]
}

const props = withDefaults(defineProps<{ searchTerm?: string }>(), { searchTerm: '' })

const PAGE_SIZE = 18
// Each tag can be linked to dozens of monographs: without `first` WPGraphQL stops at 10.
const TAGS_QUERY = `
  query PropertyTags {
    tags(first: 500) {
      nodes { id name description posts(first: 200) { nodes { title uri } } }
    }
  }
`

const { query } = useGraphQL()
const letter = ref('A')
const pages = ref(1)
const openTag = ref<TagEntry | null>(null)

const { data: tags, pending, error } = await useAsyncData('property-tags', async (): Promise<TagEntry[]> => {
  const result = await query<{ tags: WpConnection<TagNode> }>(TAGS_QUERY)
  return result.tags.nodes
    .map((tag) => ({
      id: tag.id,
      name: decodeEntities(tag.name),
      description: tag.description ?? '',
      plants: tag.posts.nodes
        .filter((plant): plant is { title: string; uri: string } => Boolean(plant.uri?.trim()))
        .map((plant) => ({ title: decodeEntities(plant.title), uri: normalizePath(plant.uri) })),
    }))
    .filter((tag) => tag.plants.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }))
})


const filtered = computed(() => {
  const term = props.searchTerm.trim().toLowerCase()
  return (tags.value ?? []).filter((tag) =>
    initialLetter(tag.name) === letter.value && (!term || tag.name.toLowerCase().includes(term)))
})

const visible = computed(() => filtered.value.slice(0, pages.value * PAGE_SIZE))

const summary = computed(() => {
  const search = props.searchTerm.trim() ? ` e la ricerca "${props.searchTerm.trim()}"` : ''
  const count = filtered.value.length
  if (!count) return `Nessuna proprietà trovata per la lettera ${letter.value}${search}`
  return `${count} ${count === 1 ? 'proprietà trovata' : 'proprietà trovate'} per la lettera ${letter.value}${search}`
})

watch([letter, () => props.searchTerm], () => { pages.value = 1 })
</script>
