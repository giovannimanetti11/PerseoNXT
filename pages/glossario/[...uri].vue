<template>
  <div id="post" v-if="glossaryTerm">
    <schemaMarkup :glossaryTerm="glossaryTerm" />
    <!-- Main upper term container -->
    <section class="postGlossario-info-section flex flex-col md:flex-row py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">

      <!-- Container for main term information -->
      <div class="mt-10 md:mt-20 container mx-auto w-full md:w-3/5 px-2 md:px-4 print:mt-8 print:px-0">
        <!-- Breadcrumbs -->
        <div class="mb-12">
          <Breadcrumbs 
            :currentPageName="glossaryTerm.title" 
            parentPath="/glossario" 
            parentName="Glossario" 
          />
        </div>
        <GlossarioInfo 
          :title="glossaryTerm.title"
          :publishDate="glossaryTerm.date"
          :updateDate="glossaryTerm.modified"
          :authorName="glossaryTerm.authorName"
          :readingTime="readingTime"
        />
      </div>
      <!-- Container for featured image -->
      <div class="flex flex-col w-full md:w-2/5 mt-10 md:mt-20">
        <NuxtImg v-if="glossaryTerm.featuredImage" class="m-auto h-48 md:h-60 w-auto border rounded-2xl transition-all duration-300 ease-in-out shadow-lg mb-4" :src="glossaryTerm.featuredImage.node.sourceUrl" :alt="glossaryTerm.featuredImage.node.altText" />
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

    <!-- Content sections -->
    <section v-for="(section, index) in sections"
            :class="['term-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full', section.className]"
            :id="'section' + (index + 1)"
            :key="section.heading">
      <div class="flex items-center" v-if="section.heading !== 'Riferimenti'">
        <div class="circle flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 mr-4 bg-blu text-white rounded-full text-base md:text-lg font-bold">
          {{ index + 1 }}
        </div>
        <h3 class="text-xl md:text-2xl">{{ section.heading }}</h3>
      </div>
      <h3 v-else class="text-xl md:text-2xl mb-4">{{ section.heading }}</h3>
      <div class="mt-4">
        <InternalLinking 
          :content="section.content" 
          :current-slug="glossaryTerm.slug"
          :global-linked-words="globalLinkedWords"
          @update:globalLinkedWords="updateGlobalLinkedWords"
        />
      </div>
    </section>
  </div>
  <div v-else class="flex justify-center text-center w-full items-center h-64">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import GlossarioInfo from '@/components/glossario/glossarioinfo.vue';
import InternalLinking from '@/components/internalLinking.vue';
import Breadcrumbs from '~/components/breadcrumbs.vue';

const route = useRoute();
const slug = ref(route.params.uri instanceof Array ? route.params.uri[0] : route.params.uri);

const globalLinkedWords = ref(new Set());

const FETCH_GLOSSARY_TERM_BY_SLUG = gql`
  query GetGlossaryTermBySlug($slug: String!) {
    glossaryTermBy(slug: $slug) {
      title
      authorName
      date
      modified
      content
      slug
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

const FETCH_ALL_POSTS_AND_TERMS = gql`
  query FetchAllPostsAndTerms {
    posts(first: 1000) {
      nodes {
        title
        slug
        excerpt
      }
    }
    glossaryTerms(first: 1000) {
      nodes {
        title
        slug
        excerpt
        plurale
      }
    }
  }
`;


const { result: termResult} = useQuery(FETCH_GLOSSARY_TERM_BY_SLUG, { slug: slug.value });
const { result: allItemsResult } = useQuery(FETCH_ALL_POSTS_AND_TERMS);

const glossaryTerm = computed(() => termResult.value?.glossaryTermBy || null);
const allItems = computed(() => {
  const posts = allItemsResult.value?.posts?.nodes || [];
  const terms = allItemsResult.value?.glossaryTerms?.nodes || [];
  return [...posts, ...terms];
});

const headings = ref([]);
const sections = ref([]);
const readingTime = ref(0);

const updateGlobalLinkedWords = (newWords) => {
  newWords.forEach(word => {
    const lowercaseWord = word.toLowerCase();
    if (!globalLinkedWords.value.has(lowercaseWord)) {
      globalLinkedWords.value.add(lowercaseWord);
      const matchingTerm = allItems.value.find(item => 
        item.title.toLowerCase() === lowercaseWord || item.plurale?.toLowerCase() === lowercaseWord
      );
      if (matchingTerm) {
        globalLinkedWords.value.add(matchingTerm.title.toLowerCase());
        if (matchingTerm.plurale) {
          globalLinkedWords.value.add(matchingTerm.plurale.toLowerCase());
        }
      }
    }
  });
};


const processContent = async (content) => {
  const { load } = await import('cheerio');
  const $ = load(content);
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
  readingTime.value = Math.ceil(wordCount / 200);
};

watch(() => glossaryTerm.value, async (newTerm, oldTerm) => {
  if (newTerm && newTerm.content) {
    if (!oldTerm || newTerm.slug !== oldTerm.slug) {
      globalLinkedWords.value = new Set();
    }
    await processContent(newTerm.content);
  }
}, { immediate: true });

const smoothScroll = (targetId) => {
  const targetElement = document.querySelector(targetId);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: 'smooth' });
  } else {
    console.error("Target element not found for smooth scroll:", targetId);
  }
};

onMounted(() => {
  console.log('Component mounted. Initial globalLinkedWords:', new Set(globalLinkedWords.value));
});

watch(globalLinkedWords, (newValue) => {
  console.log('globalLinkedWords changed:', new Set(newValue));
}, { deep: true });

watch(() => route.params.uri, () => {
  globalLinkedWords.value = new Set();
  console.log('Route changed. Reset globalLinkedWords:', new Set(globalLinkedWords.value));
});
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

.circle {
  min-width: 2rem;
  min-height: 2rem;
}

@media (min-width: 768px) {
  .circle {
    min-width: 3rem;
    min-height: 3rem;
  }
}
</style>