<template>
  <NumberedSection v-if="content.intro">
    <RichContent :content="content.intro" />
  </NumberedSection>

  <template v-for="section in content.sections" :key="section.heading">
    <slot name="before" :heading="section.heading" />
    <NumberedSection
      :heading="section.heading"
      :number="numberOf(section.heading)"
      :hide-number="section.heading === 'Riferimenti'"
      :extra-class="`w-11/12 ${section.className}`"
    >
      <RichContent v-if="section.html" class="mt-4" :content="section.html" />
      <div v-for="subsection in section.subsections" :key="subsection.heading" class="mt-6">
        <h3 class="text-lg md:text-xl font-semibold mb-2">{{ subsection.heading }}</h3>
        <RichContent v-if="subsection.html" :content="subsection.html" />
      </div>
    </NumberedSection>
  </template>
</template>

<script setup lang="ts">
import type { StructuredContent } from '#shared/types/content'

const props = defineProps<{
  content: StructuredContent
  /** Full table of contents of the page, used to number the sections. */
  toc: string[]
}>()

const numberOf = (heading: string) => props.toc.indexOf(heading) + 1
</script>
