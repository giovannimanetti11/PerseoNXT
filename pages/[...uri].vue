<template>
  <div>
    <!-- Loading state -->
    <div v-if="post.loading" class="flex justify-center text-center w-full items-center h-64 mt-12" aria-live="polite" aria-busy="true">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu" aria-label="Caricamento"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="post.error" role="alert" aria-live="assertive">Si è verificato un errore: {{ post.error.message }}</div>

    <!-- Content state -->
    <div v-else-if="post.data" id="post">
      <SchemaMarkup :post="post.data" :tag="null" />

      <!-- Post info section -->
      <section class="post-info-section flex flex-col md:flex-row py-20 px-2 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
        <!-- Mobile slideshow -->
        <div class="md:hidden w-full mb-8">
          <ClientOnly>
            <Suspense>
              <Slideshow 
                v-if="hasImages"
                :featured-image="featuredImage"
                :additional-images="additionalImages"
              />
              <template #fallback>
                <div class="animate-pulse bg-gray-200 h-64 w-full rounded-2xl" aria-hidden="true"></div>
              </template>
            </Suspense>
          </ClientOnly>
        </div>

        <!-- Post information container -->
        <div class="w-full md:w-2/5 md:mt-28 container mx-auto px-2 print:mt-8 print:px-0 order-2 md:order-1">
          <div class="mb-12">
            <Breadcrumbs 
              :currentPageName="post.data.title" 
              parentPath="/piante-medicinali" 
              parentName="Piante medicinali" 
            />
          </div>
          <PostInfo 
            :title="post.data.title"
            :nomeScientifico="post.data.nomeScientifico"
            :publishDate="post.data.date"
            :modifiedDate="post.data.modified"
            :content="post.data.content"
            :authorName="post.data.authorName"
            :revisionData="post.data.revisionData"
          />
        </div>

        <!-- Desktop slideshow and map -->
        <div class="w-full md:w-3/5 flex flex-col order-3 md:order-2">
          <div class="hidden md:block mr-16 mb-8">
            <ClientOnly>
              <Suspense>
                <Slideshow 
                  v-if="hasImages"
                  :featured-image="featuredImage"
                  :additional-images="additionalImages"
                />
                <template #fallback>
                  <div class="animate-pulse bg-gray-200 h-64 w-full rounded-2xl" aria-hidden="true"></div>
                </template>
              </Suspense>
            </ClientOnly>
          </div>
          <ClientOnly>
            <Suspense>
              <ObservationsMap :nomeScientifico="post.data.nomeScientifico" class="mt-8 md:mt-0 pb-4 w-full m-auto" />
              <template #fallback>
                <div class="animate-pulse bg-gray-200 h-64 w-full rounded-2xl" aria-hidden="true"></div>
              </template>
            </Suspense>
          </ClientOnly>
        </div>
      </section>

      <!-- Index section -->
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

      <!-- Properties section -->
      <section v-if="post.data.tags && post.data.tags.nodes.length > 0" class="post-section-proprieta flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full" id="section1">
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 min-w-8 min-h-8 md:min-w-12 md:min-h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold" aria-hidden="true">1</div>
          <h3 class="text-xl md:text-2xl">Proprietà terapeutiche</h3>
        </div>
        <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4">
          <li v-for="tag in post.data.tags.nodes" :key="tag.id" 
              class="relative hover:bg-blu hover:text-white text-center py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full sm:w-2/5 md:w-1/5 flex-grow-0 flex-shrink-0"
              @click="toggleTooltip(tag.id)"
              @mouseenter="showTooltip(tag.id)">
            {{ tag.name }}
            <div v-if="activeTooltip === tag.id" 
                class="tooltip-custom fixed z-50 bg-white rounded-lg shadow-lg text-sm text-gray-700"
                :style="tooltipStyle"
                @click.stop>
              <div class="p-6">
                <h4 class="text-2xl font-bold text-blu text-left mb-4">{{ tag.name }}</h4>
                <button @click.stop="hideTooltip" class="absolute top-2 right-2 text-blu hover:text-celeste" aria-label="Chiudi tooltip">
                  <Icon name="mdi:close" class="text-xl" aria-hidden="true" />
                </button>
                <p v-html="tag.description" class="font-normal text-left"></p>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <!-- Split sections container -->
      <div class="flex flex-col md:flex-row w-11/12 mx-auto print:w-full gap-4 md:gap-8">
        <div class="flex flex-col w-full md:w-1/2 mx-auto print:w-full">
          <!-- Scientific name section -->
          <section v-if="post.data.nomeScientifico" class="post-section-nome-scientifico flex flex-col w-full py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 print:py-2 print:px-0" id="section2">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 min-w-8 min-h-8 md:min-w-12 md:min-h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold" aria-hidden="true">2</div>
              <h3 class="text-xl md:text-2xl">Nome scientifico</h3>
            </div>
            <p class="text-center italic mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full md:w-2/5">{{ post.data.nomeScientifico }}</p>
          </section>
          
          <!-- Used parts section -->
          <section v-if="post.data.partiUsate" class="post-section-parti-usate flex flex-col w-full py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 print:py-2 print:px-0" id="section3">
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
        <div v-if="post.data.nomeComune" class="post-section-nome-comune flex flex-col w-full md:w-1/2 py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full" id="section4">
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
      <section v-if="post.data.costituenti && !hasFitochimicaSection" class="post-section-fitochimica flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full" id="section5">
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 min-w-8 min-h-8 md:min-w-12 md:min-h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold" aria-hidden="true">5</div>
          <h3 class="text-xl md:text-2xl">Fitochimica</h3>
        </div>
        <div class="mt-4" v-if="post.data.costituenti" v-html="sanitizeHtml(post.data.costituenti)"></div>
      </section>

      <!-- Dynamic content sections -->
      <section v-for="(section, index) in post.structuredContent"
               :class="['post-content-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full', section.className]"
               :id="'section' + (post.data.costituenti && !hasFitochimicaSection ? 5 + index + 1 : 5 + index)"
               :key="section.title">
        <div class="flex items-center space-x-4" v-if="section.title !== 'Riferimenti'">
          <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 min-w-8 min-h-8 md:min-w-12 md:min-h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold" aria-hidden="true">{{ post.data.costituenti && !hasFitochimicaSection ? 5 + index + 1 : 5 + index }}</div>
          <h3 class="text-xl md:text-2xl">{{ section.title }}</h3>
        </div>
        <h3 v-else class="text-xl md:text-2xl mb-4">{{ section.title }}</h3>

        <div class="mt-4" v-if="section.content" v-html="sanitizeHtml(section.content)"></div>

        <div v-for="(subSection, subIndex) in section.subSections" :key="subIndex" class="mt-6">
          <h4 class="text-lg md:text-xl font-semibold mb-2">{{ subSection.title }}</h4>
          <div v-if="subSection.content" v-html="sanitizeHtml(subSection.content)"></div>
        </div>
      </section>

      <EditContentProposal :sections="allHeadings" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, computed, defineAsyncComponent, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { useRuntimeConfig, useAsyncData, useHead } from '#app';
import { useReferences } from '~/composables/useReferences'
import DOMPurify from 'dompurify'

// Import critical components directly to improve SEO
import Breadcrumbs from '@/components/breadcrumbs.vue';
import PostInfo from '@/components/posts/postinfo.vue';

// Lazy load non-critical components
const Slideshow = defineAsyncComponent(() => import('@/components/posts/slideshow.vue'));
const ObservationsMap = defineAsyncComponent(() => import('@/components/posts/observationsMap.vue'));
const EditContentProposal = defineAsyncComponent(() => import('@/components/editContentProposal.vue'));
const SchemaMarkup = defineAsyncComponent(() => import('@/components/schemaMarkup.vue'));

const config = useRuntimeConfig();
const route = useRoute();
const { resolveClient } = useApolloClient();
const apolloClient = resolveClient();

// Sanitize HTML to prevent XSS attacks
const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class', 'id', 'style'],
    ALLOW_DATA_ATTR: false
  });
};

// Add to setup
const { parseReferences } = useReferences()

// GraphQL query to fetch post data
const FETCH_POST_BY_SLUG = gql`
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

// Reactive state for post data
const post = reactive({
  data: null as any,
  headings: [] as string[],
  structuredContent: [] as any[]
});

// Active tooltip state
const activeTooltip = ref<string | null>(null);

const { data: postData, pending, error } = useAsyncData(
  () => `postData-${Array.isArray(route.params.uri) ? route.params.uri[0] : route.params.uri}`,
  async () => {
    const slug = Array.isArray(route.params.uri) ? route.params.uri[0] : route.params.uri;

    try {
      const { data } = await apolloClient.query({
        query: FETCH_POST_BY_SLUG,
        variables: { slug }
      });
      if (!data.postBy) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Pagina non trovata',
          fatal: true
        });
      }
      
      const postData = data.postBy;
      return postData;
    } catch (err) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Pagina non trovata',
        fatal: true
      });
    }
  },
  {
    watch: [() => route.params.uri]
  }
);

// Watch for changes in postData and update post reactive object
watch(postData, async (newPostData) => {
  post.data = newPostData;

  if (newPostData) {
    await nextTick();
    processPostContent();
  }
}, { immediate: true });

// Computed for SEO data
const seoTitle = computed(() => postData.value?.seo?.title || postData.value?.title || '');
const seoDescription = computed(() => postData.value?.seo?.metaDesc || '');
const seoImage = computed(() => 
  postData.value?.seo?.opengraphImage?.sourceUrl || 
  postData.value?.featuredImage?.node?.sourceUrl || 
  'https://wikiherbalist.com/media/og-image.jpg'
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

// Computed properties for images
const featuredImage = computed(() => {
  if (post.data?.featuredImage?.node) {
    return {
      sourceUrl: post.data.featuredImage.node.sourceUrl,
      altText: post.data.featuredImage.node.altText || ''
    };
  }
  return null;
});

const openGraphImage = computed(() => {
  if (featuredImage.value && featuredImage.value.sourceUrl) {
    return featuredImage.value.sourceUrl;
  }
  return 'https://wikiherbalist.com/images/default-plant-og-image.jpg';
});

const additionalImages = computed(() => {
  if (post.data?.additionalImages) {
    return post.data.additionalImages.map(img => ({
      url: img.sourceUrl,
      altText: img.altText || ''
    }));
  }
  return [];
});

// Check if post has images
const hasImages = computed(() => {
  return !!featuredImage.value || additionalImages.value.length > 0;
});

// Function to process post content and extract headings and sections
const processPostContent = () => {
  if (!post.data || !post.data.content) return;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = post.data.content;

  const headings: string[] = [];
  const sections: any[] = [];
  let currentSection: any = null;
  let currentSubSection: any = null;

  Array.from(tempDiv.children).forEach((elem) => {
    if (elem.tagName === 'H3') {
      if (currentSection) {
        if (currentSubSection) {
          currentSection.subSections.push(currentSubSection);
          currentSubSection = null;
        }
        sections.push(currentSection);
      }
      const title = elem.textContent?.trim() || '';
      headings.push(title);
      currentSection = {
        title: title,
        content: '',
        subSections: [],
        className: `post-section-${title.toLowerCase().replace(/[\s,\'\`]+/g, '-').replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')}`
      };
    } else if (elem.tagName === 'H4') {
      if (currentSubSection) {
        currentSection.subSections.push(currentSubSection);
      }
      currentSubSection = {
        title: elem.textContent?.trim() || '',
        content: ''
      };
    } else {
      if (elem.tagName === 'P' && elem.textContent?.trim() === "Riferimenti") {
        if (currentSection) {
          if (currentSubSection) {
            currentSection.subSections.push(currentSubSection);
            currentSubSection = null;
          }
          sections.push(currentSection);
        }
        currentSection = {
          title: "Riferimenti",
          content: '',
          className: 'post-section-riferimenti'
        };
      } else if (currentSubSection) {
        currentSubSection.content += elem.outerHTML;
      } else if (currentSection) {
        currentSection.content += elem.outerHTML;
      }
    }
  });

  if (currentSection) {
    if (currentSubSection) {
      currentSection.subSections.push(currentSubSection);
    }
    sections.push(currentSection);
  }

  post.headings = headings;
  post.structuredContent = sections;
};

// Compute all headings
const allHeadings = computed(() => {
  const staticHeadings = ["Proprietà terapeutiche", "Nome scientifico", "Parti usate", "Nome comune"];
  
  // Only add "Fitochimica" to static headings if it doesn't exist in post.headings
  if (!post.headings.includes("Fitochimica") && post.data?.costituenti) {
    staticHeadings.push("Fitochimica");
  }
  
  return [...staticHeadings, ...post.headings];
});

// Parse comma-separated string into array
const parseStringToArray = (str?: string): string[] => str?.split(/[\s]*[;,][\s]*/).filter(Boolean) || [];

// Computed properties for parsed arrays
const partiUsateArray = computed(() => parseStringToArray(post.data?.partiUsate));
const nomeComuneArray = computed(() => parseStringToArray(post.data?.nomeComune));

// Tooltip interaction functions
const showTooltip = (tagId: string) => activeTooltip.value = tagId;
const hideTooltip = () => activeTooltip.value = null;
const toggleTooltip = (tagId: string) => {
  if (activeTooltip.value === tagId) {
    hideTooltip();
  } else {
    showTooltip(tagId);
  }
};

// Computed styles for tooltip
const tooltipStyle = computed(() => ({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '600px',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflowY: 'auto'
}));

// Event handler for clicks outside the tooltip
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

// Smooth scroll function
const smoothScroll = (targetId: string) => {
  if (process.client) {
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

// Lifecycle hooks
onMounted(() => {
  if (process.client) {
    window.addEventListener('click', handleClickOutside);
    processPostContent(); // Ensure content is processed after mount
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('click', handleClickOutside);
  }
});

// Add computed property for references
const references = computed(() => {
  const referencesSection = post.data.structuredContent?.find(section => section.title === 'Riferimenti')
  if (referencesSection?.content) {
    return parseReferences(referencesSection.content)
  }
  return []
})

// Add computed property to check if "Fitochimica" section already exists in the content
const hasFitochimicaSection = computed(() => post.structuredContent?.some(section => section.title === 'Fitochimica') || false)
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

@media (max-width: 768px) {
  .tooltip-custom {
    width: 90vw !important;
  }
}
</style>