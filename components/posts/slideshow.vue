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
        loading="eager"
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
          loading="eager"
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
          loading="eager"
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import VueEasyLightbox from 'vue-easy-lightbox';

interface Image {
  url: string;
  altText: string;
}

interface FeaturedImage {
  sourceUrl?: string;
  altText?: string;
}

interface Props {
  featuredImage?: FeaturedImage;
  additionalImages?: Image[];
}

const props = withDefaults(defineProps<Props>(), {
  featuredImage: undefined,
  additionalImages: () => []
});

// Compute featured image source
const featuredImageSrc = computed(() => props.featuredImage?.sourceUrl || null);
const featuredImageAlt = computed(() => props.featuredImage?.altText || '');

// Check if slideshow has content
const hasSlideshowContent = computed(() => {
  return !!featuredImageSrc.value || props.additionalImages.length > 0;
});

// Check if thumbnails should be shown
const hasThumbnails = computed(() => {
  return !!featuredImageSrc.value || validAdditionalImages.value.length > 0;
});

// State management
const currentImage = ref(featuredImageSrc.value);
const currentAltText = ref(featuredImageAlt.value);
const lightboxVisible = ref(false);

// Filter and validate additional images
const validAdditionalImages = computed(() => {
  return (props.additionalImages || []).filter((image): image is Image => !!image?.url);
});

// Prepare images for lightbox
const allImages = computed(() => {
  const images = [
    ...(featuredImageSrc.value ? [featuredImageSrc.value] : []),
    ...validAdditionalImages.value.map(img => img.url)
  ];
  return images;
});

// Get current image index for lightbox
const currentImageIndex = computed(() => allImages.value.indexOf(currentImage.value || ''));

// Image management functions
const setCurrentImage = (imageUrl: string, altText: string): void => {
  currentImage.value = imageUrl;
  currentAltText.value = altText;
};

const openLightbox = (): void => {
  lightboxVisible.value = true;
};

const closeLightbox = (): void => {
  lightboxVisible.value = false;
};

// Thumbnail class generator
const thumbnailClass = (imageUrl: string): string[] => [
  'cursor-pointer rounded-2xl transition-all duration-300 ease-in-out mx-0.5',
  currentImage.value === imageUrl ? 'w-16 h-16 border-3 border-blue' : 'w-14 h-14 border-3 border-light-blue'
];

// Initialize component
onMounted(() => {
  if (featuredImageSrc.value) {
    setCurrentImage(featuredImageSrc.value, featuredImageAlt.value);
  }
});
</script>