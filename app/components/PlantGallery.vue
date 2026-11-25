<template>
  <div v-if="images.length" class="mt-4 md:mt-24 flex flex-col md:float-right print:mt-8">
    <div class="relative h-auto w-full md:w-96 md:float-right hover:cursor-pointer hover:opacity-85">
      <NuxtImg
        :src="current.sourceUrl"
        class="m-auto md:ml-auto md:mr-0 h-60 w-auto border rounded-2xl transition-all duration-300 ease-in-out"
        :alt="current.altText"
        width="384"
        height="240"
        format="webp"
        loading="eager"
        fetchpriority="high"
        @click="lightbox = true"
      />
    </div>
    <div class="additional-images w-full mt-1.5 flex flex-wrap justify-center md:justify-end">
      <div v-for="(image, index) in images" :key="image.sourceUrl" class="h-16">
        <NuxtImg
          :src="image.sourceUrl"
          :alt="image.altText"
          :class="[
            'cursor-pointer rounded-2xl transition-all duration-300 ease-in-out mx-0.5 border-3',
            index === currentIndex ? 'w-16 h-16' : 'w-14 h-14',
          ]"
          width="64"
          height="64"
          format="webp"
          loading="eager"
          @click="currentIndex = index"
          @mouseover="currentIndex = index"
        />
      </div>
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
