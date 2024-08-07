<template>
  <div id="post" v-if="glossaryTerm">
    <!-- Main upper term container -->
    <section class="postGlossario-info-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
      <!-- Container for featured image (mobile) -->
      <div class="md:hidden w-full mt-8 md:mt-0 mb-8">
        <NuxtImg 
          v-if="glossaryTerm.featuredImage" 
          class="m-auto h-60 w-auto border rounded-2xl transition-all duration-300 ease-in-out shadow-lg" 
          :src="glossaryTerm.featuredImage.node.sourceUrl" 
          :alt="glossaryTerm.featuredImage.node.altText" 
        />
      </div>
    
      <div class="flex flex-col md:flex-row">
        <!-- Container for main term information -->
        <div class="w-full md:w-3/5 lg:w-2/5 md:mt-40 container mx-auto px-2 print:mt-8 print:px-0 order-2 md:order-1">
          <GlossarioInfo 
            :title="glossaryTerm.title"
            :publishDate="glossaryTerm.date"
            :updateDate="glossaryTerm.modified"
            :authorName="glossaryTerm.authorName"
            :readingTime="readingTime"
          />
        </div>
    
        <!-- Container for featured image (desktop) -->
        <div class="hidden md:flex w-full md:w-2/5 lg:w-3/5 flex-col order-1 md:order-2 md:justify-center md:items-end">
          <NuxtImg 
            v-if="glossaryTerm.featuredImage" 
            class="m-auto md:m-0 h-60 w-auto border rounded-2xl transition-all duration-300 ease-in-out shadow-lg mb-4" 
            :src="glossaryTerm.featuredImage.node.sourceUrl" 
            :alt="glossaryTerm.featuredImage.node.altText" 
          />
        </div>
      </div>
    </section>
    <!-- Index section -->
    <section class="postGlossario-index-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto mt-4 rounded-2xl">
      <div class="font-bold text-xl md:text-2xl">
        <icon name="ic:twotone-list" class="text-2xl md:text-3xl text-black rounded-full mr-2" /> Indice
      </div>
      <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4 print:gap-0 print:mt-2">
        <li v-for="(heading, index) in headings" :key="index" class="flex text-center py-2 md:py-4 px-2 md:px-4 bg-verde text-white rounded-xl m-1 text-xs md:text-sm hover:bg-celeste cursor-pointer w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc(20%-0.5rem)]">
          <a :href="'#section' + (index + 1)" class="flex items-center group w-full" @click.prevent="smoothScroll('#section' + (index + 1))">
            <div class="circle flex-shrink-0 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white text-verde rounded-full mr-2 text-sm md:text-lg font-bold group-hover:text-celeste">{{ index + 1 }}</div>
            <span class="flex-grow text-left">{{ heading }}</span>
          </a>
        </li>
      </ul>
    </section>
    <!-- Start of content sections -->
    <section v-for="(section, index) in sections"
            :class="['term-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full', section.className]"
            :id="'section' + (index + 1)"
            :key="section.heading">
      <div class="flex items-start" v-if="section.heading !== 'Riferimenti'">
        <div class="circle flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5">{{ index + 1 }}</div>
        <h3 class="text-xl md:text-2xl mt-1 md:mt-0 flex-grow">{{ section.heading }}</h3>
      </div>
      <h3 v-else class="text-xl md:text-2xl mb-4">{{ section.heading }}</h3>
      <div v-html="sanitizedContent(section.content)" class="mt-4"></div>
    </section>
  </div>
  <div v-else class="flex flex-row py-20 px-10 w-11/12 mx-auto rounded-2xl">
    <icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste text-center mt-10 mx-auto" />
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import cheerio from 'cheerio';
import GlossarioInfo from '@/components/glossario/glossarioinfo.vue';

import DOMPurify from 'dompurify';

const sanitizedContent = (content) => {
  return DOMPurify.sanitize(content);
};

const route = useRoute();
const slug = ref(route.params.uri instanceof Array ? route.params.uri[0] : route.params.uri);

// Define GraphQL query
const FETCH_GLOSSARY_TERM_BY_SLUG = gql`
query GetGlossaryTermBySlug($slug: String!) {
  glossaryTermBy(slug: $slug) {
    title
    authorName
    date
    content
    featuredImage {
      node {
        altText
        caption
        sourceUrl
      }
    }
  }
}
`;

const { result, error } = useQuery(FETCH_GLOSSARY_TERM_BY_SLUG, { slug: slug.value });

const glossaryTerm = computed(() => result.value?.glossaryTermBy || {});

const headings = ref([]);
const sections = ref([]);
const readingTime = ref(0);

watchEffect(() => {
  if (error.value) {
    console.error("GraphQL Error:", error.value);
  }

  if (glossaryTerm.value && glossaryTerm.value.content) {
    const $ = cheerio.load(glossaryTerm.value.content);
    const extractedHeadings = [];
    const extractedSections = [];
    let wordCount = 0;

    $('h3').each(function (index) {
      const headingText = $(this).text().trim();
      const headingId = `section${index + 1}`;
      $(this).attr('id', headingId);

      extractedHeadings.push(headingText);
      const sectionContent = $(this).nextUntil('h3, p:contains("Riferimenti")').toArray().map(el => $.html(el)).join('');
      extractedSections.push({
        heading: headingText,
        content: sectionContent,
        className: `post-section-${headingText.toLowerCase().replace(/[\s,\'\`]+/g, '-').replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')}`
      });

      // Add words count for title and content
      wordCount += headingText.split(/\s+/).length;
      wordCount += sectionContent ? sectionContent.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
    });

    // Extract "Riferimenti" section
    const referencesElement = $('p:contains("Riferimenti")');
    if (referencesElement.length) {
      const referencesContent = $('<div>').append(referencesElement.nextAll().clone()).html();
      extractedSections.push({
        heading: "Riferimenti",
        content: referencesContent,
        className: "post-section-riferimenti"
      });
    }

    headings.value = extractedHeadings;
    sections.value = extractedSections;
    readingTime.value = Math.ceil(wordCount / 200); // Reading time calculation
  }
});

const smoothScroll = (targetId) => {
  const targetElement = document.querySelector(targetId);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: 'smooth' });
  } else {
    console.error("Target element not found for smooth scroll:", targetId);
  }
};
</script>

<style scoped>
.postGlossario-info-section, .postGlossario-index-section {
  background: rgb(245,245,245);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 100%);
}

.term-section {
  background: rgb(224,237,253);
  background: linear-gradient(180deg, rgba(245,245,245,1) 0%, rgba(224,237,253,1) 100%);
}
</style>
