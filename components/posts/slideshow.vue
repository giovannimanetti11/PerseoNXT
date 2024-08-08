<template>
  <div class="mt-4 md:mt-24 flex flex-col md:float-right print:mt-8 content-center">
    <!-- Image section that triggers lightbox on click -->
    <div v-show="currentImage" class="relative h-auto w-full md:w-96 md:float-right hover:cursor-pointer hover:opacity-85">
      <NuxtImg
        :src="currentImage"
        class="m-auto h-60 w-auto border rounded-2xl transition-all duration-300 ease-in-out"
        :alt="currentAltText"
        @click="openLightbox"
        width="384"
        height="240"
        format="webp"
        loading="lazy"
      />
    </div>

    <!-- Thumbnails of additional images, including featured image -->
    <div v-show="additionalImages.length > 0 || featuredImage" class="w-full mt-1.5 flex flex-wrap justify-center">
      <!-- Featured image thumbnail -->
      <div v-if="featuredImage && featuredImage.node && featuredImage.node.sourceUrl" class="h-16">
        <NuxtImg
          :src="featuredImage.node.sourceUrl"
          :class="thumbnailClass(featuredImage.node.sourceUrl)"
          @click="setCurrentImage(featuredImage.node.sourceUrl, featuredImage.node.altText)"
          @mouseover="setCurrentImage(featuredImage.node.sourceUrl, featuredImage.node.altText)"
          :alt="featuredImage.node.altText"
          width="64"
          height="64"
          format="webp"
          loading="lazy"
        />
      </div>
      <!-- Other images thumbnails -->
      <div v-for="(image, index) in validAdditionalImages" :key="index" class="h-16">
        <NuxtImg 
          :src="image.url"
          :class="thumbnailClass(image.url)"
          @click="setCurrentImage(image.url, image.altText)"
          @mouseover="setCurrentImage(image.url, image.altText)"
          :alt="image.altText"
          width="64"
          height="64"
          format="webp"
          loading="lazy"
        />
      </div>
    </div>

    <!-- Lightbox component from vue-easy-lightbox -->
    <vue-easy-lightbox
      :visible="lightboxVisible"
      :imgs="allImages"
      :index="currentImageIndex"
      @hide="closeLightbox"
    ></vue-easy-lightbox>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import VueEasyLightbox from 'vue-easy-lightbox';

const props = defineProps({
  featuredImage: Object,
  additionalImages: Array
});

const currentImage = ref(props.featuredImage?.node?.sourceUrl || null);
const currentAltText = ref(props.featuredImage?.node?.altText || '');

const lightboxVisible = ref(false);

const allImages = computed(() => [props.featuredImage.node.sourceUrl, ...props.additionalImages.map(img => img.url).filter(url => url !== props.featuredImage.node.sourceUrl)]);

const currentImageIndex = computed(() => allImages.value.indexOf(currentImage.value));

const setCurrentImage = (imageUrl, altText) => {
  currentImage.value = imageUrl;
  currentAltText.value = altText;
};

const openLightbox = () => {
  lightboxVisible.value = true;
};

const closeLightbox = () => {
  lightboxVisible.value = false;
};

const validAdditionalImages = computed(() => props.additionalImages.filter(image => image?.url));

const thumbnailClass = (imageUrl) => [
  'cursor-pointer rounded-2xl transition-all duration-300 ease-in-out mx-0.5',
  currentImage.value === imageUrl ? 'w-16 h-16 border-3 border-blue' : 'w-14 h-14 border-3 border-light-blue'
];
</script>