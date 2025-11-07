<!-- URI POST -->
<template>
  <div>
    <!-- Loading state -->
    <div v-if="pending" class="flex justify-center text-center w-full items-center h-64 mt-12" aria-live="polite" aria-busy="true">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu" aria-label="Caricamento"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" role="alert" aria-live="assertive">Si è verificato un errore: {{ error.message }}</div>

    <!-- Content state -->
    <div v-else-if="postData" id="post">
      <!-- Post info section -->
      <section class="post-info-section flex flex-col md:flex-row py-20 px-2 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
        <!-- Mobile slideshow -->
        <div v-if="featuredImage || (additionalImages && additionalImages.length > 0)" class="md:hidden w-full mb-8">
          <Suspense>
            <Slideshow
              :featured-image="featuredImage"
              :additional-images="additionalImages"
            />
            <template #fallback>
              <div class="bg-gray-200 h-60 w-full rounded-2xl flex items-center justify-center" aria-hidden="true">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
              </div>
            </template>
          </Suspense>
        </div>

        <!-- Post information container -->
        <div class="w-full md:w-2/5 md:mt-28 container mx-auto px-2 print:mt-8 print:px-0 order-2 md:order-1">
          <div class="mb-12">
            <Breadcrumbs
              :currentPageName="postData.title"
              parentPath="/piante-medicinali"
              parentName="Piante medicinali"
            />
          </div>
          <PostInfo
            :title="postData.title"
            :nomeScientifico="postData.nomeScientifico"
            :publishDate="postData.date"
            :modifiedDate="postData.modified"
            :content="postData.content"
            :authorName="postData.authorName"
            :revisionData="postData.revisionData"
          />
        </div>

        <!-- Desktop slideshow and map -->
        <div class="w-full md:w-3/5 flex flex-col order-3 md:order-2">
          <div v-if="featuredImage || (additionalImages && additionalImages.length > 0)" class="md:block mr-16 mb-8">
            <Suspense>
              <Slideshow
                :featured-image="featuredImage"
                :additional-images="additionalImages"
              />
              <template #fallback>
                <div class="bg-gray-200 h-60 w-full rounded-2xl flex items-center justify-center" aria-hidden="true">
                  <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
                </div>
              </template>
            </Suspense>
          </div>
          <ClientOnly>
            <Suspense>
              <ObservationsMap :nomeScientifico="postData.nomeScientifico" class="mt-8 md:mt-0 pb-4 w-full m-auto" />
              <template #fallback>
                <div class="animate-pulse bg-gray-200 h-64 w-full rounded-2xl" aria-hidden="true"></div>
              </template>
            </Suspense>
          </ClientOnly>
        </div>
      </section>

      <!-- Index section - Now SSR-rendered -->
      <section class="post-index-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full">
        <div class="font-bold text-xl md:text-2xl flex items-center">
          <Icon name="ic:twotone-list" class="text-2xl md:text-3xl text-black rounded-full mr-2" aria-hidden="true" />
          <div id="table-of-contents" class="font-bold text-xl md:text-2xl">Indice</div>
        </div>
        <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4 print:gap-0 print:mt-2" aria-labelledby="table-of-contents">
          <li v-for="(heading, index) in allHeadings" :key="index" class="text-center py-2 md:py-4 px-2 md:px-4 bg-verde text-white rounded-xl text-xs md:text-sm hover:bg-celeste cursor-pointer w-full sm:w-2/5 md:w-1/5 flex-grow-0 flex-shrink-0">
            <a :href="'#section' + (index + 1)" class="flex items-center group" @click.prevent="smoothScroll('#section' + (index + 1))">
              <div class="circle flex items-center justify-center w-6 h-6 md:w-8 md:h-8 min-w-6 min-h-6 md:min-w-8 md:min-h-8 bg-white text-verde rounded-full mr-1 md:mr-2 text-sm md:text-lg font-bold group-hover:text-celeste">{{ index + 1 }}</div>
              <span class="text-xs md:text-sm">{{ heading }}</span>
            </a>
          </li>
        </ul>
      </section>

      <!-- Dynamic content sections - Now SSR-rendered -->
        <!-- Properties section -->
        <section v-if="postData.tags && postData.tags.nodes.length > 0" class="post-section-proprieta flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full" id="section1">
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 min-w-8 min-h-8 md:min-w-12 md:min-h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold" aria-hidden="true">1</div>
            <h3 class="text-xl md:text-2xl">Proprietà terapeutiche</h3>
          </div>
          <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4">
            <li v-for="tag in postData.tags.nodes" :key="tag.id" 
                class="relative hover:bg-blu hover:text-white text-center py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full sm:w-2/5 md:w-1/5 flex-grow-0 flex-shrink-0"
                @click="toggleTooltip(tag.id)"
                @mouseenter="handleMouseEnterTag(tag.id)"
                @mouseleave="handleMouseLeaveTag">
              {{ tag.name }}
              <div v-if="activeTooltip === tag.id"
                  class="tooltip-custom fixed z-50 bg-white border border-blu rounded-lg shadow-xl text-sm text-gray-700"
                  :style="tooltipStyle"
                  @click.stop>
                <div class="p-6">
                  <h4 class="text-2xl font-bold text-blu text-left mb-4">{{ tag.name }}</h4>
                  <button @click.stop="hideTooltip" class="absolute top-2 right-2 text-blu hover:text-celeste" aria-label="Chiudi tooltip">
                    <Icon name="mdi:close" class="text-xl" aria-hidden="true" />
                  </button>
                  <p v-html="sanitizeHtml(tag.description)" class="font-normal text-left"></p>
                </div>
              </div>
            </li>
          </ul>
        </section>

        <!-- Split sections container -->
        <div class="flex flex-col md:flex-row w-11/12 mx-auto print:w-full gap-4 md:gap-8">
          <div class="flex flex-col w-full md:w-1/2 mx-auto print:w-full">
            <!-- Scientific name section -->
            <section v-if="postData.nomeScientifico" class="post-section-nome-scientifico flex flex-col w-full py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 print:py-2 print:px-0" id="section2">
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 min-w-8 min-h-8 md:min-w-12 md:min-h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold" aria-hidden="true">2</div>
                <h3 class="text-xl md:text-2xl">Nome scientifico</h3>
              </div>
              <p class="text-center italic mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full md:w-2/5">{{ postData.nomeScientifico }}</p>
            </section>

            <!-- Used parts section -->
            <section v-if="postData.partiUsate" class="post-section-parti-usate flex flex-col w-full py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 print:py-2 print:px-0" id="section3">
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 min-w-8 min-h-8 md:min-w-12 md:min-h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold" aria-hidden="true">3</div>
                <h3 class="text-xl md:text-2xl">Parti usate</h3>
              </div>
              <div class="flex flex-wrap gap-2 md:gap-4">
                <p v-for="parte in partiUsateArray" :key="parte" class="text-center mt-2 md:mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full sm:w-2/5">{{ parte }}</p>
              </div>
            </section>
          </div>

          <!-- Common name section -->
          <div v-if="postData.nomeComune" class="post-section-nome-comune flex flex-col w-full md:w-1/2 py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full" id="section4">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 min-w-8 min-h-8 md:min-w-12 md:min-h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold" aria-hidden="true">4</div>
              <h3 class="text-xl md:text-2xl">Nome comune</h3>
            </div>
            <div class="flex flex-wrap gap-2 md:gap-4">
              <p v-for="nome in nomeComuneArray" :key="nome" class="text-center mt-2 md:mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full sm:w-2/5">{{ nome }}</p>
            </div>
          </div>
        </div>

        <!-- Phytochemistry section - only show if no "Fitochimica" H3 exists in content -->
        <section v-if="postData.costituenti && !hasFitochimicaSection" class="post-section-fitochimica flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full" id="section5">
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 min-w-8 min-h-8 md:min-w-12 md:min-h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold" aria-hidden="true">5</div>
            <h3 class="text-xl md:text-2xl">Fitochimica</h3>
          </div>
          <div class="mt-4">
            <ContentTooltip
              v-if="postData.costituenti"
              :content="postData.costituenti"
            />
          </div>
        </section>

        <!-- Dynamic content sections -->
        <section v-for="(section, index) in structuredContent"
                 :class="['post-content-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4', section.className]"
                 :id="'section' + (postData.costituenti && !hasFitochimicaSection ? 5 + index + 1 : 5 + index)"
                 :key="section.heading">
          <div class="flex items-center space-x-4" v-if="section.heading !== 'Riferimenti'">
            <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 min-w-8 min-h-8 md:min-w-12 md:min-h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold" aria-hidden="true">{{ postData.costituenti && !hasFitochimicaSection ? 5 + index + 1 : 5 + index }}</div>
            <h3 class="text-xl md:text-2xl">{{ section.heading }}</h3>
          </div>
          <h3 v-else class="text-xl md:text-2xl mb-4">{{ section.heading }}</h3>

          <div class="mt-4">
            <ContentTooltip
              v-if="section.content"
              :content="section.content"
            />
          </div>

          <div v-for="(subSection, subIndex) in section.subSections" :key="subIndex" class="mt-6">
            <h4 class="text-lg md:text-xl font-semibold mb-2">{{ subSection.heading }}</h4>
            <ContentTooltip
              v-if="subSection.content"
              :content="subSection.content"
            />
          </div>
        </section>

      <ClientOnly>
        <EditContentProposal :sections="allHeadings" />
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useAsyncData, useHead } from '#app';
import DOMPurify from 'isomorphic-dompurify'
import { useGraphQL } from '~/composables/useGraphQL';
import { useContentProcessor } from '~/composables/useContentProcessor';

// Import critical components directly to improve SEO
import ContentTooltip from '@/components/contentTooltip.vue';
import Breadcrumbs from '@/components/breadcrumbs.vue';
import PostInfo from '@/components/posts/postinfo.vue';

// Lazy load non-critical components
const Slideshow = defineAsyncComponent(() => import('@/components/posts/slideshow.vue'));
const ObservationsMap = defineAsyncComponent(() => import('@/components/posts/observationsMap.vue'));
const EditContentProposal = defineAsyncComponent(() => import('@/components/editContentProposal.vue'));

const route = useRoute();
const { query } = useGraphQL();

// Sanitize HTML to prevent XSS attacks
const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class', 'id', 'style'],
    ALLOW_DATA_ATTR: false
  });
};

// GraphQL query to fetch post data
const FETCH_POST_BY_SLUG = `
  query FetchPostBySlug($slug: String!) {
    postBy(slug: $slug) {
      id
      title
      content
      slug
      date
      authorName
      nomeScientifico
      partiUsate
      nomeComune
      costituenti
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
      revisionData {
        date
      }
      featuredImage {
        node {
          altText
          caption
          sourceUrl
        }
      }
      additionalImages {
        altText
        sourceUrl
      }
      tags {
        nodes {
          id
          name
          description
        }
      }
    }
  }
`;

// State management - content is now processed server-side
const activeTooltip = ref<string | null>(null);
const isScrolling = ref(false);
let mouseEnterTimeout: number | null = null;
let scrollTimeout: number | null = null;

// Fetch post data with SSR + server-side content processing
const { data: postData, pending, error } = await useAsyncData(
  `post-${Array.isArray(route.params.uri) ? route.params.uri[0] : route.params.uri}`,
  async () => {
    const slug = Array.isArray(route.params.uri) ? route.params.uri[0] : route.params.uri;
    const { processContent } = useContentProcessor();

    try {
      const data = await query(FETCH_POST_BY_SLUG, { slug });

      // Return null if post doesn't exist - error handling below
      if (!data?.postBy) {
        return null;
      }

      const post = data.postBy;

      // Process content server-side (works with cheerio on both server and client)
      const processed = post.content ? await processContent(post.content) : { headings: [], structuredContent: [] };

      // Return post data with processed content
      return {
        ...post,
        headings: processed.headings,
        structuredContent: processed.structuredContent
      };
    } catch (error) {
      console.error('Error fetching post:', error);
      // Return null on error - error handling below
      return null;
    }
  },
  {
    server: true,  // Importante per SSR
    lazy: false,   // Importante per evitare race conditions
    watch: [() => route.params.uri]  // Re-fetch quando cambia URI (SPA navigation)
  }
);

// Computed properties for processed content (now comes from server)
const headings = computed(() => postData.value?.headings || []);
const structuredContent = computed(() => postData.value?.structuredContent || []);

// Handle error/404 - check after fetch completes
// Show 404 if there's an error OR if postData is null (not found)
if (error.value || (!pending.value && !postData.value)) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Pagina non trovata',
    fatal: true
  });
}

// Computed for SEO data
const seoTitle = computed(() => postData.value?.seo?.title || postData.value?.title || '');
const seoDescription = computed(() => postData.value?.seo?.metaDesc || '');
const seoImage = computed(() => 
  postData.value?.seo?.opengraphImage?.sourceUrl || 
  postData.value?.featuredImage?.node?.sourceUrl || 
  'https://wikiherbalist.com/media/og-image.jpg'
);

// Computed properties for images (must be before useHead)
const featuredImage = computed(() => {
  if (postData.value?.featuredImage?.node) {
    return {
      sourceUrl: postData.value.featuredImage.node.sourceUrl,
      altText: postData.value.featuredImage.node.altText || ''
    };
  }
  return null;
});

const additionalImages = computed(() => {
  if (postData.value?.additionalImages) {
    return postData.value.additionalImages.map(img => ({
      url: img.sourceUrl,
      altText: img.altText || ''
    }));
  }
  return [];
});

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
  ],
  link: computed(() => {
    const links = [];
    // Preload featured image for LCP optimization
    if (featuredImage.value?.sourceUrl) {
      links.push({
        rel: 'preload',
        as: 'image',
        href: featuredImage.value.sourceUrl,
        fetchpriority: 'high'
      });
    }
    return links;
  }),
  script: computed(() => {
    if (!postData.value) return [];

    const baseUrl = 'https://wikiherbalist.com';
    const fullUrl = `${baseUrl}${route.fullPath}`;

    // Build breadcrumb list
    const breadcrumbList = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': baseUrl
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Piante medicinali',
          'item': `${baseUrl}/piante-medicinali`
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': postData.value.title,
          'item': fullUrl
        }
      ]
    };

    // Build main article schema
    const article = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${fullUrl}#article`,
      'headline': postData.value.title,
      'description': postData.value.seo?.metaDesc || postData.value.title,
      'image': featuredImage.value?.sourceUrl || `${baseUrl}/media/og-image.jpg`,
      'datePublished': postData.value.date,
      'dateModified': postData.value.modified || postData.value.date,
      'author': {
        '@type': 'Person',
        'name': postData.value.authorName || 'Team Wikiherbalist'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Wikiherbalist',
        'logo': {
          '@type': 'ImageObject',
          'url': `${baseUrl}/media/logo.png`
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': fullUrl
      },
      'about': {
        '@type': ['MedicalEntity', 'Substance'],
        'name': postData.value.title,
        'alternateName': postData.value.nomeScientifico
      },
      'articleSection': 'Fitoterapia',
      'inLanguage': 'it-IT'
    };

    return [
      {
        type: 'application/ld+json',
        children: JSON.stringify(breadcrumbList)
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify(article)
      }
    ];
  })
});

// Compute all headings (now from server-processed data)
const allHeadings = computed(() => {
  const staticHeadings = ["Proprietà terapeutiche", "Nome scientifico", "Parti usate", "Nome comune"];

  // Only add "Fitochimica" to static headings if it doesn't exist in headings
  if (!headings.value.includes("Fitochimica") && postData.value?.costituenti) {
    staticHeadings.push("Fitochimica");
  }

  return [...staticHeadings, ...headings.value];
});

// Parse comma-separated string into array
const parseStringToArray = (str?: string): string[] => str?.split(/[\s]*[;,][\s]*/).filter(Boolean) || [];

// Computed properties for parsed arrays
const partiUsateArray = computed(() => parseStringToArray(postData.value?.partiUsate));
const nomeComuneArray = computed(() => parseStringToArray(postData.value?.nomeComune));

const showTooltip = (tagId: string) => {
  if (isScrolling.value) return;
  activeTooltip.value = tagId;
};

const hideTooltip = () => {
  if (mouseEnterTimeout) clearTimeout(mouseEnterTimeout);
  activeTooltip.value = null;
};

const toggleTooltip = (tagId: string) => {
  if (isScrolling.value) return;
  if (activeTooltip.value === tagId) {
    hideTooltip();
  } else {
    showTooltip(tagId);
  }
};

const handleMouseEnterTag = (tagId: string) => {
  if (isScrolling.value) return;
  showTooltip(tagId);
};

const handleMouseLeaveTag = () => {
  if (mouseEnterTimeout) clearTimeout(mouseEnterTimeout);
};

const smoothScroll = (target: string) => {
  if (!process.client) return;
  const element = document.querySelector(target);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const handleScrollPage = () => {
  if (!process.client) return;
  hideTooltip();
  isScrolling.value = true;
  if (scrollTimeout) clearTimeout(scrollTimeout);
  scrollTimeout = window.setTimeout(() => {
    isScrolling.value = false;
  }, 200);
};

const tooltipStyle = computed(() => ({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '600px',
  maxWidth: '90vw',
  maxHeight: '80vh',
  overflowY: 'auto'
}));

const handleClickOutside = (event: MouseEvent) => {
  if (process.client && activeTooltip.value !== null) {
    const tooltipElement = document.querySelector('.tooltip-custom');
    if (tooltipElement && !tooltipElement.contains(event.target as Node) && !(event.target as Element).closest('.tooltip-trigger')) {
      nextTick(() => {
        hideTooltip();
      });
    }
  }
};

onMounted(() => {
  if (process.client) {
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScrollPage, { passive: true });
    // Content is now processed server-side - no client-side processing needed
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('click', handleClickOutside);
    window.removeEventListener('scroll', handleScrollPage);
  }
  if (mouseEnterTimeout) clearTimeout(mouseEnterTimeout);
  if (scrollTimeout) clearTimeout(scrollTimeout);
});

const hasFitochimicaSection = computed(() => structuredContent.value?.some(section => section.heading === 'Fitochimica') || false)
</script>

<style scoped>
.post-info-section, .post-index-section {
  background: rgb(245,245,245);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 100%);
}

.post-content-section h4 {
  color: #036297;
  font-size: 1.1rem;
  font-weight: bold;
}

section[class*="post-section-"],
div[class*="post-section-"] {
  background: rgb(224,237,253) !important;
  background: linear-gradient(180deg, rgba(245,245,245,1) 0%, rgba(224,237,253,1) 100%) !important;
}

.tooltip-custom {
  max-height: 90vh;
  overflow-y: auto;
}

.tooltip-custom h4 {
  color: #036297 !important;
}

.hidden {
  display: none !important;
}

@media (max-width: 768px) {
  .tooltip-custom {
    width: 90vw !important;
  }
}
</style>