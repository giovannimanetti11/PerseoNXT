<template>
  <div>
    <!-- Loading state -->
    <div v-if="pending" class="flex justify-center text-center w-full items-center h-64 mt-12" aria-live="polite" aria-busy="true">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu" aria-label="Caricamento"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" role="alert" aria-live="assertive">Si è verificato un errore: {{ error.message }}</div>

    <!-- Content state -->
    <div v-else-if="blogPost" id="post">
      <SchemaMarkup :blogPost="blogPost" />

      <!-- Header section -->
      <section class="post-info-section flex flex-col md:flex-row py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
        <div class="mt-10 md:mt-20 container mx-auto w-full md:w-3/5 px-2 md:px-4 print:mt-8 print:px-0">
          <div class="mb-12">
            <Breadcrumbs
              :currentPageName="blogPost.title"
              parentPath="/blog"
              parentName="Blog"
            />
          </div>
          <BlogInfo
            :title="blogPost.title"
            :publishDate="blogPost.date"
            :content="blogPost.content"
            :authorName="blogPost.authorName"
          />
        </div>
        <div class="flex flex-col w-full md:w-2/5 mt-10 md:mt-20">
          <NuxtImg v-if="blogPost?.featuredImage?.node?.sourceUrl"
            class="m-auto h-48 md:h-60 w-auto border rounded-2xl transition-all duration-300 ease-in-out shadow-lg mb-4"
            :src="blogPost.featuredImage.node.sourceUrl"
            :alt="blogPost.featuredImage.node.altText || blogPost.title"
            width="240"
            height="240"
            format="webp"
            loading="eager"
          />
        </div>
      </section>

      <!-- Index section - CLIENT SIDE ONLY -->
      <section :class="['post-index-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto mt-4 rounded-2xl', { 'hidden': !isContentProcessed || headings.length === 0 }]">
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
      <section :class="['post-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4', { 'hidden': isContentProcessed }]">
        <ContentTooltip v-if="blogPost?.content" :content="blogPost.content" />
      </section>

      <!-- PROCESSED CONTENT - Client-side only, with sections and styling -->
      <!-- Introduction section -->
      <section :class="['post-section-introduction flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4', { 'hidden': !isContentProcessed || !introSection }]">
        <ContentTooltip v-if="introSection" :content="introSection.content" />
      </section>

      <!-- Content sections -->
      <section v-for="(section, index) in sections"
              :class="['post-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4', section.className, { 'hidden': !isContentProcessed }]"
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

      <EditContentProposal :sections="headings" />
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
import BlogInfo from '~/components/blog/bloginfo.vue';
import Breadcrumbs from '~/components/breadcrumbs.vue';

// Lazy load non-critical components
const EditContentProposal = defineAsyncComponent(() => import('~/components/editContentProposal.vue'));
const SchemaMarkup = defineAsyncComponent(() => import('~/components/schemaMarkup.vue'));

// Core setup
const route = useRoute();
const { query } = useGraphQL();

// State management
const headings = ref([]);
const sections = ref([]);
const introSection = ref(null);
const isContentProcessed = ref(false);

// GraphQL query definition
const FETCH_BLOG_POST_BY_SLUG = `
  query FetchBlogPostBySlug($slug: String!) {
    blogPostBy(slug: $slug) {
      id
      title
      content
      slug
      date
      modified
      authorName
      excerpt
      featuredImage {
        node {
          altText
          sourceUrl
        }
      }
      seo {
        title
        metaDesc
        opengraphTitle
        opengraphDescription
        opengraphImage {
          sourceUrl
        }
      }
    }
  }
`;

// Fetch blog post data
const { data: blogPost, pending, error } = await useAsyncData(
  'blogPost',
  async () => {
    const slug = route.params.uri instanceof Array ? route.params.uri[0] : route.params.uri;

    try {
      const data = await query(FETCH_BLOG_POST_BY_SLUG, { slug });

      if (!data?.blogPostBy) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Pagina non trovata',
          fatal: true
        });
      }

      const postData = data.blogPostBy;
      return postData;
    } catch (error) {
      console.error('Error fetching blog post:', error);
      throw error;
    }
  },
  {
    server: true,
    lazy: false
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

// Computed for SEO data
const seoTitle = computed(() => blogPost.value?.seo?.title || blogPost.value?.title || '');
const seoDescription = computed(() => blogPost.value?.seo?.metaDesc || '');
const seoImage = computed(() =>
  blogPost.value?.seo?.opengraphImage?.sourceUrl ||
  blogPost.value?.featuredImage?.node?.sourceUrl ||
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
          className: 'post-section-introduction'
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
              className: `post-section-${headingText.toLowerCase()
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
                className: 'post-section-riferimenti'
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
          heading: blogPost.value?.title || 'Contenuto',
          content: allContent,
          className: 'post-section-contenuto'
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
        className: 'post-section-contenuto'
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
  if (process.client && blogPost.value?.content) {
    processContent(blogPost.value.content);
  }
});

// Watch for route changes during SPA navigation (client-side only)
// Watch the route params, not the content itself to avoid race conditions
watch(() => route.params.uri, async () => {
  if (process.client) {
    // Wait for next tick to ensure data is updated
    await nextTick();
    if (blogPost.value?.content) {
      // Reset flag to show raw content during processing
      isContentProcessed.value = false;
      // Process content
      processContent(blogPost.value.content);
    }
  }
});

// Navigation helper
const smoothScroll = (target) => {
  if (!process.client) return;
  const element = document.querySelector(target);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};
</script>

<style scoped>
.post-info-section, .post-index-section {
  background: rgb(245,245,245);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 100%);
}

.post-section {
  background: rgb(224,237,253) !important;
  background: linear-gradient(180deg, rgba(245,245,245,1) 0%, rgba(224,237,253,1) 100%) !important;
}

.circle {
  min-width: 2rem;
  min-height: 2rem;
}

.hidden {
  display: none !important;
}

@media (min-width: 768px) {
  .circle {
    min-width: 3rem;
    min-height: 3rem;
  }
}
</style>