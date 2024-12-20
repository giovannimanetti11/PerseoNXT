<template>
  <div>
    <!-- Loading state -->
    <div v-if="pending" class="flex justify-center text-center w-full items-center h-64 mt-12" aria-live="polite" aria-busy="true">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu" aria-label="Caricamento"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" role="alert" aria-live="assertive">Si è verificato un errore: {{ error.message }}</div>

    <!-- Content state -->
    <div v-else-if="glossaryTerm" id="post">
      <SchemaMarkup :glossaryTerm="glossaryTerm" />

      <!-- Header section -->
      <section class="postGlossario-info-section flex flex-col md:flex-row py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
        <div class="mt-10 md:mt-20 container mx-auto w-full md:w-3/5 px-2 md:px-4 print:mt-8 print:px-0">
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
            :authorName="glossaryTerm.authorName"
            :readingTime="readingTime"
          />
        </div>
        <div class="flex flex-col w-full md:w-2/5 mt-10 md:mt-20">
          <NuxtImg v-if="glossaryTerm.featuredImage" 
            class="m-auto h-48 md:h-60 w-auto border rounded-2xl transition-all duration-300 ease-in-out shadow-lg mb-4" 
            :src="glossaryTerm.featuredImage.node.sourceUrl" 
            :alt="glossaryTerm.featuredImage.node.altText" 
          />
        </div>
      </section>

      <!-- Index section -->
      <section v-if="headings.length > 0" class="postGlossario-index-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto mt-4 rounded-2xl">
        <div class="font-bold text-xl md:text-2xl">
          <Icon name="ic:twotone-list" class="text-2xl md:text-3xl text-black rounded-full mr-2" /> Indice
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

      <!-- Introduction section -->
      <section v-if="introSection" class="term-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full post-section-introduction">
        <div class="mt-4">
          <InternalLinking 
            :content="introSection.content"
            :current-slug="glossaryTerm.slug"
            :global-linked-words="globalLinkedWords"
            @update:globalLinkedWords="updateGlobalLinkedWords"
          />
        </div>
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
  </div>
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { useYoastSeo } from '~/composables/useYoastSeo';
import { useRuntimeConfig } from '#app';

const GlossarioInfo = defineAsyncComponent(() => 
  import('~/components/glossario/glossarioinfo.vue')
);
const Breadcrumbs = defineAsyncComponent(() => 
  import('~/components/breadcrumbs.vue')
);
const InternalLinking = defineAsyncComponent(() => 
  import('~/components/internalLinking.vue')
);
const SchemaMarkup = defineAsyncComponent(() => 
  import('~/components/schemaMarkup.vue')
);

const config = useRuntimeConfig();
const route = useRoute();
const apolloClient = useApolloClient().resolveClient();

// State management
const globalLinkedWords = ref(new Set());
const headings = ref([]);
const sections = ref([]);
const introSection = ref(null);
const yoastData = ref(null);
const readingTime = ref(0);

// GraphQL query definition
const FETCH_GLOSSARY_TERM_BY_SLUG = gql`
  query GetGlossaryTermBySlug($slug: String!) {
    glossaryTermBy(slug: $slug) {
      databaseId
      title
      authorName
      date
      content
      slug
      status
      modified
      seo {
        title
        metaDesc
        opengraphTitle
        opengraphDescription
        opengraphImage {
          sourceUrl
        }
      }
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

const { data: glossaryTerm, pending, error } = await useAsyncData(
  'glossaryTerm',
  async () => {
    const slug = route.params.uri instanceof Array ? route.params.uri[0] : route.params.uri;

    try {
      const { data } = await apolloClient.query({
        query: FETCH_GLOSSARY_TERM_BY_SLUG,
        variables: { slug },
        fetchPolicy: 'no-cache'
      });

      return data.glossaryTermBy;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },
  { 
    server: true,
    immediate: true
  }
);

watch(glossaryTerm, async (newTerm) => {
  if (newTerm?.content) {
    const wordCount = newTerm.content
      .replace(/<[^>]*>/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .length;
    
    readingTime.value = Math.ceil(wordCount / 200);
    await processContent(newTerm.content);
  }
}, { immediate: true });

async function processContent(content) {
  try {
    const cheerio = await import('cheerio');
    const $ = cheerio.load(content);
    
    const extractedHeadings = [];
    const extractedSections = [];
    
    // Extract introduction
    const firstH3 = $('h3').first();
    if (firstH3.length) {
      const introContent = firstH3
        .prevAll()
        .map((_, el) => $.html(el))
        .get()
        .reverse()
        .join('');

      if (introContent.trim()) {
        introSection.value = {
          content: introContent,
          className: 'term-section'
        };
      }
    }

    // Process main sections
    let currentSection = null;
    
    $('body > *').each(function(index, element) {
      const $element = $(element);
      
      // Check for h3 headings
      if (element.tagName === 'h3') {
        if (currentSection) {
          extractedSections.push(currentSection);
        }
        
        const headingText = $element.text().trim();
        extractedHeadings.push(headingText);
        
        currentSection = {
          heading: headingText,
          content: '',
          className: `term-section-${headingText.toLowerCase()
            .replace(/[\s,\'\`]+/g, '-')
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')}`
        };
      } 
      // Check for "Riferimenti" as a paragraph
      else if (element.tagName === 'p' && $element.text().trim() === 'Riferimenti') {
        if (currentSection) {
          extractedSections.push(currentSection);
        }
        
        currentSection = null;
        
        // Find all content after the "Riferimenti" paragraph
        const referenceContent = $element
          .nextAll()
          .map((_, el) => $.html(el))
          .get()
          .join('');
        
        if (referenceContent.trim()) {
          extractedSections.push({
            heading: 'Riferimenti',
            content: referenceContent,
            className: 'term-section-riferimenti'
          });
        }
      }
      // Add content to current section
      else if (currentSection) {
        currentSection.content += $.html(element);
      }
    });

    // Add the last section if exists and it's not references
    if (currentSection) {
      extractedSections.push(currentSection);
    }

    headings.value = extractedHeadings;
    sections.value = extractedSections;
    
  } catch (error) {
    console.error('Content processing error:', error);
    throw error;
  }
}

// Watch for term changes and update SEO
watch(glossaryTerm, (newTerm) => {
  if (newTerm) {
    const fullUrl = `https://wikiherbalist.com${route.fullPath}`;
    yoastData.value = {
      ...newTerm.seo,
      siteName: config.public.siteName,
      url: fullUrl,
      type: 'article',
      image: newTerm.seo?.opengraphImage?.sourceUrl || 
             newTerm.featuredImage?.node?.sourceUrl || 
             'https://wikiherbalist.com/images/default-og-image.jpg',
      publishedTime: newTerm.date,
      modifiedTime: newTerm.modified || newTerm.date,
      author: newTerm.authorName,
    };

    useYoastSeo(yoastData);
  }
});

const smoothScroll = (targetId) => {
  if (!process.client) return;
  const element = document.querySelector(targetId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

// Watch for route changes and reset linked words
watch(() => route.params.uri, () => {
  globalLinkedWords.value.clear();
});

const updateGlobalLinkedWords = (newWords) => {
  newWords.forEach(word => globalLinkedWords.value.add(word));
};
</script>

<style scoped>
.postGlossario-info-section, .postGlossario-index-section {
  background: rgb(245,245,245);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 100%);
}

.term-section {
  background: rgb(224,237,253) !important;
  background: linear-gradient(180deg, rgba(245,245,245,1) 0%, rgba(224,237,253,1) 100%) !important;
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