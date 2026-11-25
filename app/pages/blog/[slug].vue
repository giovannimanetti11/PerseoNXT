<template>
  <div id="post">
    <section class="soft-gradient flex flex-col md:flex-row py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
      <div class="mt-10 md:mt-20 mx-auto w-full md:w-3/5 px-2 md:px-4 print:mt-8 print:px-0">
        <Breadcrumbs class="mb-12" :current-page-name="post.title" parent-path="/blog" parent-name="Blog" />
        <ContentHeader
          :title="post.title"
          :author="post.authorName"
          :published="post.date"
          :modified="post.modified"
          :reading-time="post.readingTime"
        />
      </div>
      <div v-if="post.featuredImage" class="flex flex-col w-full md:w-2/5 mt-10 md:mt-20">
        <NuxtImg
          class="m-auto h-48 md:h-60 w-auto border rounded-2xl shadow-lg mb-4"
          :src="post.featuredImage.sourceUrl"
          :alt="post.featuredImage.altText || post.title"
          width="240"
          height="240"
          format="webp"
          loading="eager"
          fetchpriority="high"
        />
      </div>
    </section>

    <TableOfContents :headings="toc" />
    <ContentSections :content="post.content" :toc="toc" />

    <ClientOnly>
      <EditProposal :sections="toc" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const post = await useContentPage('blog')
const toc = computed(() => post.value.content.sections.map((section) => section.heading))
</script>
