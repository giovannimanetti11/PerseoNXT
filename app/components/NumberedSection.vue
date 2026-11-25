<template>
  <section
    :id="number ? `section${number}` : undefined"
    :class="['content-section section-gradient flex flex-col py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 scroll-mt-28 print:py-2 print:px-0', extraClass]"
  >
    <div v-if="heading" class="flex items-center gap-4">
      <span
        v-if="number && !hideNumber"
        class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold"
        aria-hidden="true"
      >
        {{ number }}
      </span>
      <h2 class="text-xl md:text-2xl">{{ heading }}</h2>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  heading?: string
  /** Position in the table of contents; builds the #sectionN anchor. */
  number?: number
  hideNumber?: boolean
  extraClass?: string
}>(), { heading: '', number: 0, hideNumber: false, extraClass: 'w-11/12' })
</script>
