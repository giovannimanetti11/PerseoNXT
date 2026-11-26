<template>
  <NumberedSection v-if="content.intro" :extra-class="sectionWidth">
    <RichContent :content="content.intro" />
  </NumberedSection>

  <template v-for="section in content.sections" :key="section.heading">
    <slot name="before" :heading="section.heading" />
    <NumberedSection
      :heading="section.heading"
      :number="numberOf(section.heading)"
      :hide-number="!numberReferences && section.heading === 'Riferimenti'"
      :extra-class="`${sectionWidth} ${section.className}`"
    >
      <RichContent v-if="section.html" class="mt-4" :content="section.html" />
      <div v-for="subsection in section.subsections" :key="subsection.heading" class="mt-6">
        <h3 class="subsection-heading text-lg md:text-xl font-semibold mb-2">{{ subsection.heading }}</h3>
        <RichContent v-if="subsection.html" :content="subsection.html" />
      </div>
      <slot name="inside" :heading="section.heading" />
    </NumberedSection>
    <slot name="after" :heading="section.heading" />
  </template>
</template>

<script setup lang="ts">
import type { StructuredContent } from '#shared/types/content'

const props = withDefaults(defineProps<{
  content: StructuredContent
  /** Full table of contents of the page, used to number the sections. */
  toc: string[]
  /** Width classes of each section: monographs put them in a column next to the index. */
  sectionWidth?: string
  /** Show the number on "Riferimenti" too, as the index does (monographs). */
  numberReferences?: boolean
}>(), { sectionWidth: 'w-11/12', numberReferences: false })

const numberOf = (heading: string) => props.toc.indexOf(heading) + 1
</script>
