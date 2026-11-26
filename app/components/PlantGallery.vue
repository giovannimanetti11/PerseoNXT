<template>
  <div v-if="images.length" class="flex flex-col items-center lg:items-end gap-2">
    <figure class="flex flex-col items-center lg:items-end gap-2 max-w-full">
      <button type="button" class="max-w-full hover:opacity-85" aria-label="Apri l'immagine a schermo intero" @click="lightbox = true">
        <NuxtImg
          v-if="current.local"
          :src="current.src"
          :alt="current.alt"
          class="h-60 md:h-72 w-auto max-w-full border rounded-2xl"
          height="288"
          format="webp"
          loading="eager"
          fetchpriority="high"
        />
        <img v-else :src="current.src" :alt="current.alt" class="h-60 md:h-72 w-auto max-w-full border rounded-2xl" height="288">
      </button>
      <figcaption class="min-h-5 text-xs text-gray-500 text-center lg:text-right">
        <a v-if="current.credit" :href="current.creditUrl" target="_blank" rel="noopener noreferrer" class="hover:text-blu">{{ current.credit }}</a>
      </figcaption>
    </figure>
    <div class="flex flex-wrap justify-center lg:justify-end gap-1.5" role="group" aria-label="Galleria">
      <button
        v-for="(image, index) in images"
        :key="image.src"
        type="button"
        :aria-label="`Immagine ${index + 1}`"
        :aria-pressed="index === currentIndex"
        :class="['rounded-xl overflow-hidden border-3 transition-opacity', index === currentIndex ? 'border-celeste' : 'border-transparent opacity-80 hover:opacity-100']"
        @click="currentIndex = index"
        @mouseover="currentIndex = index"
      >
        <NuxtImg v-if="image.local" :src="image.src" alt="" class="w-14 h-14 object-cover" width="56" height="56" format="webp" loading="lazy" />
        <img v-else :src="image.thumb" alt="" class="w-14 h-14 object-cover" width="56" height="56" loading="lazy">
      </button>
    </div>
    <ClientOnly>
      <VueEasyLightbox :visible="lightbox" :imgs="images.map((image) => image.src)" :index="currentIndex" @hide="lightbox = false" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import VueEasyLightbox from 'vue-easy-lightbox'
import type { ContentImage } from '#shared/types/content'
import type { MediaItem } from '#shared/types/plantData'

interface GalleryImage {
  src: string
  thumb: string
  alt: string
  /** Served by our image provider (WordPress uploads); source images load from their own CDN. */
  local: boolean
  credit: string
  creditUrl: string
}

const props = withDefaults(defineProps<{
  featured: ContentImage | null
  additional: ContentImage[]
  /** Images from Wikimedia Commons and iNaturalist, each with its credit line. */
  sourceMedia?: MediaItem[]
  title: string
}>(), { sourceMedia: () => [] })

const fromWordPress = (image: ContentImage): GalleryImage => ({
  src: image.sourceUrl, thumb: image.sourceUrl, alt: image.altText || props.title, local: true, credit: '', creditUrl: '',
})

const images = computed<GalleryImage[]>(() => [
  ...(props.featured ? [fromWordPress(props.featured)] : []),
  ...props.additional.map(fromWordPress),
  ...props.sourceMedia.map((item) => ({
    // Commons "url" is the original file (often several MB): the 800px rendition is enough here.
    src: item.thumbnailUrl, thumb: item.thumbnailUrl, alt: props.title, local: false, credit: item.credit, creditUrl: item.pageUrl,
  })),
])

const currentIndex = ref(0)
const lightbox = ref(false)
const current = computed(() => images.value[currentIndex.value] ?? images.value[0] ?? { src: '', thumb: '', alt: '', local: true, credit: '', creditUrl: '' })

watch(() => props.featured?.sourceUrl, () => { currentIndex.value = 0 })
</script>
