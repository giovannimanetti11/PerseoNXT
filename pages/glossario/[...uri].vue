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
          <NuxtImg v-if="glossaryTerm?.featuredImage?.node?.sourceUrl"
            class="m-auto h-48 md:h-60 w-auto border rounded-2xl transition-all duration-300 ease-in-out shadow-lg mb-4"
            :src="glossaryTerm.featuredImage.node.sourceUrl"
            :alt="glossaryTerm.featuredImage.node.altText || glossaryTerm.title"
            width="240"
            height="240"
            format="webp"
            loading="eager"
          />
        </div>
      </section>

      <!-- Index section - CLIENT SIDE ONLY -->
      <section v-if="isContentProcessed && headings.length > 0" class="postGlossario-index-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto mt-4 rounded-2xl">
        <div class="font-bold text-xl md:text-2xl flex items-center">
          <Icon name="ic:twotone-list" class="text-2xl md:text-3xl text-black rounded-full mr-2" />
          <div id="table-of-contents" class="font-bold text-xl md:text-2xl">Indice</div>
        </div>
        <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4 print:gap-0 print:mt-2">
          <li v-for="(heading, index) in headings" :key="index" class="flex text-center py-2 md:py-4 px-2 md:px-4 bg-verde text-white rounded-xl m-1 text-xs md:text-sm hover:bg-celeste cursor-pointer w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc(20%-0.5rem)]">
            <a :href="'#section' + (index + 1)" class="flex items-center group w-full" @click.prevent="smoothScroll('#section' + (index + 1))">
              <div class="circle flex-shrink-0 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 min-w-6 min-h-6 md:min-w-8 md:min-h-8 bg-white text-verde rounded-full mr-2 text-sm md:text-lg font-bold group-hover:text-celeste">{{ index + 1 }}</div>
              <span class="flex-grow text-left">{{ heading }}</span>
            </a>
          </li>
        </ul>
      </section>

      <!-- RAW CONTENT for SSR - Googlebot sees this immediately -->
      <section v-if="!isContentProcessed && glossaryTerm.content" class="term-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4">
        <ContentTooltip :content="glossaryTerm.content" />
      </section>

      <!-- PROCESSED CONTENT - Client-side only, with sections and styling -->
      <template v-if="isContentProcessed">
        <!-- Introduction section -->
        <section v-if="introSection" class="term-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4">
          <ContentTooltip :content="introSection.content" />
        </section>

        <!-- Content sections -->
        <section v-for="(section, index) in sections"
                :class="['term-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4', section.className]"
                :id="'section' + (index + 1)"
                :key="section.heading">
          <div class="flex items-center" v-if="section.heading !== 'Riferimenti'">
            <div class="circle flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 min-w-8 min-h-8 md:min-w-12 md:min-h-12 mr-4 bg-blu text-white rounded-full text-base md:text-lg font-bold">
              {{ index + 1 }}
            </div>
            <h3 class="text-xl md:text-2xl">{{ section.heading }}</h3>
          </div>
          <h3 v-else class="text-xl md:text-2xl mb-4">{{ section.heading }}</h3>
          <ContentTooltip v-if="section.content" :content="section.content" class="mt-4" />
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { useGraphQL } from '~/composables/useGraphQL';
import { useHead } from '#app';

// Import critical components directly for better SSR
import ContentTooltip from '~/components/contentTooltip.vue';
import GlossarioInfo from '~/components/glossario/glossarioinfo.vue';
import Breadcrumbs from '~/components/breadcrumbs.vue';

// Lazy load non-critical components
const SchemaMarkup = defineAsyncComponent(() =>
  import('~/components/schemaMarkup.vue')
);

const route = useRoute();
const { query } = useGraphQL();

// State management
const headings = ref([]);
const sections = ref([]);
const introSection = ref(null);
const readingTime = ref(0);
const isContentProcessed = ref(false); // Flag to track if content has been processed client-side

// GraphQL query definition
const FETCH_GLOSSARY_TERM_BY_SLUG = `
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
      const data = await query(FETCH_GLOSSARY_TERM_BY_SLUG, { slug });

      if (!data?.glossaryTermBy) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Pagina non trovata',
          fatal: true
        });
      }

      const termData = data.glossaryTermBy;
      return termData;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },
  {
    server: true,  // Force SSR only - prevents client-side refetch
    lazy: false,
    watch: [() => route.params.uri]  // Watch route changes for SPA navigation
  }
);

// Handle error/404 - check after fetch completes
if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Pagina non trovata',
    fatal: true
  });
}

// Calculate reading time from content
if (glossaryTerm.value?.content) {
  const wordCount = glossaryTerm.value.content
    .replace(/<[^>]*>/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .length;

  readingTime.value = Math.ceil(wordCount / 200);
}

// Computed for SEO data
const seoTitle = computed(() => glossaryTerm.value?.seo?.title || glossaryTerm.value?.title || '');
const seoDescription = computed(() => glossaryTerm.value?.seo?.metaDesc || '');
const seoImage = computed(() => 
  glossaryTerm.value?.seo?.opengraphImage?.sourceUrl || 
  glossaryTerm.value?.featuredImage?.node?.sourceUrl || 
  'https://wikiherbalist.com/images/default-og-image.jpg'
);

// Set meta tags with useHead at top level
useHead({
  title: seoTitle,
  meta: [
    { name: 'description', content: seoDescription },
    { property: 'og:title', content: seoTitle },
    { property: 'og:description', content: seoDescription },
    { property: 'og:image', content: seoImage },
    { property: 'og:type', content: 'article' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: seoTitle },
    { name: 'twitter:description', content: seoDescription },
    { name: 'twitter:image', content: seoImage }
  ]
});

// Content processing function - CLIENT-SIDE ONLY
// This runs after mount to create the fancy UI with sections, index, etc.
// SSR shows raw content so Googlebot sees everything immediately
async function processContent(content) {
  // Safety check
  if (!content || typeof content !== 'string') {
    console.warn('processContent: invalid content');
    isContentProcessed.value = true; // Mark as processed to avoid showing duplicate content
    return;
  }

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
    
    try {
      // First try with 'body > *' selector
      const bodyElements = $('body > *');
      
      // If no body elements found, try with direct children of the root
      const elements = bodyElements.length ? bodyElements : $('> *');
      
      elements.each(function(index, element) {
        try {
          const $element = $(element);
          
          // Check for h3 headings
          if (element.tagName && element.tagName.toLowerCase() === 'h3') {
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
          else if (element.tagName && element.tagName.toLowerCase() === 'p' && $element.text().trim() === 'Riferimenti') {
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
        } catch (elementError) {
          console.warn('Error processing element:', elementError);
          // Continue with next element
        }
      });
    } catch (selectorError) {
      console.error('Error with selector:', selectorError);
      // Try a fallback approach - get all content
      const allContent = $.html();
      if (allContent) {
        extractedSections.push({
          heading: glossaryTerm.value?.title || 'Contenuto',
          content: allContent,
          className: 'term-section-contenuto'
        });
      }
    }

    // Add the last section if exists and it's not references
    if (currentSection) {
      extractedSections.push(currentSection);
    }

    // Ensure we have at least one section
    if (extractedSections.length === 0 && content.trim()) {
      extractedSections.push({
        heading: 'Contenuto',
        content: content,
        className: 'term-section-contenuto'
      });
    }

    headings.value = extractedHeadings;
    sections.value = extractedSections;

    // Mark content as processed - this will trigger UI update to show sections
    isContentProcessed.value = true;

  } catch (error) {
    console.error('Content processing error:', error);
    // Don't throw - show raw content instead
    isContentProcessed.value = true;
  }
}

// Client-side content processing after mount
onMounted(() => {
  if (process.client && glossaryTerm.value?.content) {
    processContent(glossaryTerm.value.content);
  }
});

// Watch for route changes during SPA navigation (client-side only)
// Watch the route params, not the content itself to avoid race conditions
watch(() => route.params.uri, async () => {
  if (process.client) {
    // Wait for next tick to ensure data is updated
    await nextTick();
    if (glossaryTerm.value?.content) {
      // Reset flag to show raw content during processing
      isContentProcessed.value = false;
      // Process content
      processContent(glossaryTerm.value.content);
    }
  }
});

const smoothScroll = (targetId) => {
  if (!process.client) return;
  const element = document.querySelector(targetId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
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