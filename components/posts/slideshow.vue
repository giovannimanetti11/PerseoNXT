<template>
  <div class="mt-4 md:mt-24 flex flex-col md:float-right print:mt-8 content-center" v-if="hasSlideshowContent">
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
    <div v-show="hasThumbnails" class="additional-images w-full mt-1.5 flex flex-wrap justify-center">
      <!-- Featured image thumbnail -->
      <div v-if="featuredImageSrc" class="h-16">
        <NuxtImg
          :src="featuredImageSrc"
          :class="thumbnailClass(featuredImageSrc)"
          @click="setCurrentImage(featuredImageSrc, featuredImageAlt)"
          @mouseover="setCurrentImage(featuredImageSrc, featuredImageAlt)"
          :alt="featuredImageAlt"
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
import { ref, computed, onMounted } from 'vue';
import VueEasyLightbox from 'vue-easy-lightbox';

const props = defineProps({
  featuredImage: {
    type: Object,
    default: () => null
  },
  additionalImages: {
    type: Array,
    default: () => []
  }
});

const featuredImageSrc = computed(() => {
  const src = props.featuredImage?.sourceUrl || null;
  return src;
});

const featuredImageAlt = computed(() => {
  const alt = props.featuredImage?.altText || '';
  return alt;
});

const hasSlideshowContent = computed(() => {
  const result = !!featuredImageSrc.value || props.additionalImages.length > 0;
  return result;
});

const hasThumbnails = computed(() => {
  const result = !!featuredImageSrc.value || validAdditionalImages.value.length > 0;
  return result;
});

const currentImage = ref(featuredImageSrc.value);
const currentAltText = ref(featuredImageAlt.value);
const lightboxVisible = ref(false);

const validAdditionalImages = computed(() => {
  const images = props.additionalImages.filter(image => image?.url);
  return images;
});

const allImages = computed(() => {
  const images = [
    ...(featuredImageSrc.value ? [featuredImageSrc.value] : []),
    ...validAdditionalImages.value.map(img => img.url)
  ];
  return images;
});

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

const thumbnailClass = (imageUrl) => [
  'cursor-pointer rounded-2xl transition-all duration-300 ease-in-out mx-0.5',
  currentImage.value === imageUrl ? 'w-16 h-16 border-3 border-blue' : 'w-14 h-14 border-3 border-light-blue'
];
</script>