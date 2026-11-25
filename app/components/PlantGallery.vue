<template>
  <div v-if="images.length" class="flex flex-col md:items-end print:mt-8">
    <button type="button" class="block w-full md:w-96 hover:opacity-85" aria-label="Apri l'immagine a schermo intero" @click="lightbox = true">
      <NuxtImg
        :src="current.sourceUrl"
        :alt="current.altText"
        class="m-auto md:ml-auto md:mr-0 h-60 w-auto border rounded-2xl"
        width="384"
        height="240"
        format="webp"
        loading="eager"
        fetchpriority="high"
      />
    </button>

    <div v-if="images.length > 1" class="w-full mt-1.5 flex flex-wrap justify-center md:justify-end gap-1">
      <button
        v-for="(image, index) in images"
        :key="image.sourceUrl"
        type="button"
        :aria-label="`Mostra immagine ${index + 1}`"
        :aria-pressed="index === currentIndex"
        @click="currentIndex = index"
        @mouseover="currentIndex = index"
      >
        <NuxtImg
          :src="image.sourceUrl"
          :alt="image.altText"
          :class="['rounded-2xl transition-all duration-300 border-3 object-cover', index === currentIndex ? 'w-16 h-16 border-blu' : 'w-14 h-14 border-celeste']"
          width="64"
          height="64"
          format="webp"
          loading="lazy"
        />
      </button>
    </div>

    <ClientOnly>
      <VueEasyLightbox :visible="lightbox" :imgs="images.map((image) => image.sourceUrl)" :index="currentIndex" @hide="lightbox = false" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import VueEasyLightbox from 'vue-easy-lightbox'
import type { ContentImage } from '#shared/types/content'

const props = defineProps<{
  featured: ContentImage | null
  additional: ContentImage[]
}>()

const images = computed(() => [...(props.featured ? [props.featured] : []), ...props.additional])
const currentIndex = ref(0)
const lightbox = ref(false)
const current = computed(() => images.value[currentIndex.value] ?? images.value[0] ?? { sourceUrl: '', altText: '' })

watch(images, () => { currentIndex.value = 0 })
</script>
