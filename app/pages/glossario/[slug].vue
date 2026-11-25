<template>
  <div id="post">
    <section class="detail-gradient flex flex-col md:flex-row py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
      <div class="mt-10 md:mt-20 mx-auto w-full md:w-3/5 px-2 md:px-4 print:mt-8 print:px-0">
        <Breadcrumbs class="mb-12" :current-page-name="term.title" parent-path="/glossario" parent-name="Glossario" />
        <ContentHeader
          :title="term.title"
          :author="term.authorName"
          :published="term.date"
          :modified="term.modified"
          kind="glossary"
          :reading-time="term.readingTime"
          speakable
        />
      </div>
      <div v-if="term.featuredImage" class="flex flex-col w-full md:w-2/5 mt-10 md:mt-20">
        <NuxtImg
          class="m-auto h-48 md:h-60 w-auto border rounded-2xl shadow-lg mb-4"
          :src="term.featuredImage.sourceUrl"
          :alt="term.featuredImage.altText || term.title"
          width="240"
          height="240"
          format="webp"
          loading="eager"
          fetchpriority="high"
        />
      </div>
    </section>

    <TableOfContents :headings="toc" />
    <ContentSections :content="term.content" :toc="toc" />

    <NumberedSection v-if="related.length" heading="Termini correlati">
      <p class="flex flex-wrap items-center text-base md:text-lg mt-4">
        <template v-for="(item, index) in related" :key="item.slug">
          <NuxtLink :to="`/glossario/${item.slug}`" class="text-blu hover:text-celeste transition-colors duration-300">{{ item.title }}</NuxtLink>
          <span v-if="index < related.length - 1" class="mx-2 text-gray-400" aria-hidden="true">&middot;</span>
        </template>
      </p>
    </NumberedSection>
  </div>
</template>

<script setup lang="ts">
const term = await useContentPage('glossary')

const toc = computed(() => term.value.content.sections.map((section) => section.heading))
const related = computed(() => relatedGlossaryTerms(term.value.slug))
</script>
