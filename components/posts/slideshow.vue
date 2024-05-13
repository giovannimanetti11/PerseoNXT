<template>
  <div class="mt-24 flex flex-col float-right">
    <div v-if="currentImage" class="relative h-auto w-96 float-right">
      <NuxtImg :src="currentImage" class="m-auto h-60 w-auto border rounded-2xl transition-all duration-300 ease-in-out" :alt="currentAltText" />
    </div>

    <div v-if="additionalImages.length > 0" class="w-full mt-1.5 flex flex-wrap justify-center">
      <NuxtImg 
        v-if="featuredImage && featuredImage.node && featuredImage.node.sourceUrl"
        :src="featuredImage.node.sourceUrl" 
        :class="thumbnailClass(featuredImage.node.sourceUrl)"
        @click="setCurrentImage(featuredImage.node.sourceUrl, featuredImage.node.altText)"
        @mouseover="setCurrentImage(featuredImage.node.sourceUrl, featuredImage.node.altText)"
        :alt="featuredImage.node.altText"
      />
      <!-- Filter and display only images with valid URLs -->
      <div v-for="(image, index) in additionalImages.filter(img => img.url)" :key="index" class="h-16">
        <NuxtImg 
          :src="image.url" 
          :class="thumbnailClass(image.url)"
          @click="setCurrentImage(image.url, image.altText)"
          @mouseover="setCurrentImage(image.url, image.altText)"
          :alt="image.altText"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  featuredImage: Object,
  additionalImages: Array
});

const currentImage = ref(props.featuredImage && props.featuredImage.node ? props.featuredImage.node.sourceUrl : null);
const currentAltText = ref(props.featuredImage && props.featuredImage.node ? props.featuredImage.node.altText : '');

function setCurrentImage(imageUrl, altText) {
  if (imageUrl) {
    currentImage.value = imageUrl;
    currentAltText.value = altText;
  }
}

const validAdditionalImages = computed(() => {
  return props.additionalImages.filter(image => image && image.url);
});

const thumbnailClass = (imageUrl) => [
  'cursor-pointer rounded-2xl transition-all duration-300 ease-in-out mx-0.5',
  currentImage.value === imageUrl ? 'w-16 h-16 border-3 border-blu' : 'w-14 h-14 border-3 border-celeste'
];
</script>
