<template>
  <div>
    <h1 class="sr-only">{{ post.data?.title || 'Scheda monografica' }}</h1>
    <div v-if="post.loading" class="flex justify-center text-center w-full items-center h-64 mt-12" aria-live="polite" aria-busy="true">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu" aria-label="Caricamento"></div>
    </div>
    <div v-else-if="post.error" role="alert" aria-live="assertive">Si è verificato un errore: {{ post.error.message }}</div>
    <div v-else-if="post.data" id="post">
      <SchemaMarkup :post="post.data" :tag="null" />
      <section class="post-info-section flex flex-col md:flex-row py-20 px-2 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
        <!-- Slideshow (mobile only) -->
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

        <!-- Container for post information -->
        <div class="w-full md:w-2/5 md:mt-28 container mx-auto px-2 print:mt-8 print:px-0 order-2 md:order-1">
          <PostInfo 
            :title="post.data.title"
            :nomeScientifico="post.data.nomeScientifico"
            :publishDate="post.data.date"
            :content="post.data.content"
            :authorName="post.data.authorName"
          />
        </div>

        <!-- Container for slideshow and map (desktop only) -->
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
          <h2 id="table-of-contents">Indice</h2>
        </div>
        <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4 print:gap-0 print:mt-2" aria-labelledby="table-of-contents">
          <li v-for="(heading, index) in allHeadings" :key="index" class="text-center py-2 md:py-4 px-2 md:px-4 bg-verde text-white rounded-xl text-xs md:text-sm hover:bg-celeste cursor-pointer w-full sm:w-2/5 md:w-1/5 flex-grow-0 flex-shrink-0">
            <a :href="'#section' + (index + 1)" class="flex items-center group" @click.prevent="smoothScroll('#section' + (index + 1))">
              <div class="circle flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white text-verde rounded-full mr-1 md:mr-2 text-sm md:text-lg font-bold group-hover:text-celeste">{{ index + 1 }}</div>
              <span class="text-xs md:text-sm">{{ heading }}</span>
            </a>
          </li>
        </ul>
      </section>

      <!-- Start of "static" sections -->
      <section v-if="post.data.tags && post.data.tags.nodes.length > 0" class="post-section-proprieta flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full" id="section1">
        <div class="flex items-center">
          <div class="circle flex items-center justify-center w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5" aria-hidden="true">1</div>
          <h3 class="text-xl md:text-2xl mt-1 md:mt-0">Proprietà terapeutiche</h3>
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

      <div class="flex flex-col md:flex-row w-11/12 mx-auto print:w-full gap-4 md:gap-8">
        <div class="flex flex-col w-full md:w-1/2 mx-auto print:w-full">
          <section v-if="post.data.nomeScientifico" class="post-section-nome-scientifico flex flex-col w-full py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 print:py-2 print:px-0" id="section2">
            <div class="flex items-center">
              <div class="circle flex items-center justify-center mt-1 md:mt-0 w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5" aria-hidden="true">2</div>
              <h3 class="text-xl md:text-2xl mt-1 md:mt-0">Nome scientifico</h3>
            </div>
            <p class="text-center italic mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full md:w-2/5">{{ post.data.nomeScientifico }}</p>
          </section>
          <section v-if="post.data.partiUsate" class="post-section-parti-usate flex flex-col w-full py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 print:py-2 print:px-0" id="section3">
            <div class="flex items-center">
              <div class="circle flex items-center justify-center mt-1 md:mt-0 w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5" aria-hidden="true">3</div>
              <h3 class="text-xl md:text-2xl mt-1 md:mt-0">Parti usate</h3>
            </div>
            <div class="flex flex-wrap gap-2 md:gap-4">
              <p v-for="parte in partiUsateArray" :key="parte" class="text-center mt-2 md:mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full sm:w-2/5">{{ parte }}</p>
            </div>
          </section>
        </div>
        <div v-if="post.data.nomeComune" class="post-section-nome-comune flex flex-col w-full md:w-1/2 py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full" id="section4">
          <div class="flex items-center">
            <div class="circle flex items-center justify-center mt-1 md:mt-0 w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5" aria-hidden="true">4</div>
            <h3 class="text-xl md:text-2xl mt-1 md:mt-0">Nome comune</h3>
          </div>
          <div class="flex flex-wrap gap-2 md:gap-4">
            <p v-for="nome in nomeComuneArray" :key="nome" class="text-center mt-2 md:mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full sm:w-2/5">{{ nome }}</p>
          </div>
        </div>
      </div>
      <section v-if="post.data.costituenti" class="post-section-fitochimica flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full" id="section5">
        <div class="flex items-center">
          <div class="circle flex items-center justify-center mt-1 md:mt-0 w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5" aria-hidden="true">5</div>
          <h3 class="text-xl md:text-2xl mt-1 md:mt-0">Fitochimica</h3>
        </div>
        <p class="mt-4 text-sm md:text-base">{{ post.data.costituenti }}</p>
      </section>

      <!-- "Dynamic" content sections -->
      <section v-for="(section, index) in post.structuredContent"
              :class="['post-content-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full', section.className]"
              :id="'section' + (5 + index + 1)"
              :key="section.title">
        <div class="flex items-center" v-if="section.title !== 'Riferimenti'">
          <div class="circle flex items-center justify-center mt-1 md:mt-0 w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5" aria-hidden="true">{{ 5 + index + 1 }}</div>
          <h3 class="text-xl md:text-2xl mt-1 md:mt-0">{{ section.title }}</h3>
        </div>
        <h3 v-else class="text-xl md:text-2xl mb-4 mt-1 md:mt-0">{{ section.title }}</h3>
        <InternalLinking 
          :content="section.content" 
          :current-slug="post.data?.slug || ''"
          :global-linked-words="globalLinkedWords"
          @update:globalLinkedWords="updateGlobalLinkedWords"
        />
      </section>
      <EditContentProposal :sections="allHeadings" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick, computed, defineAsyncComponent, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';

// Lazy load components for better performance
const Slideshow = defineAsyncComponent(() => import('@/components/posts/slideshow.vue'));
const PostInfo = defineAsyncComponent(() => import('@/components/posts/postinfo.vue'));
const ObservationsMap = defineAsyncComponent(() => import('@/components/posts/observationsMap.vue'));
const InternalLinking = defineAsyncComponent(() => import('@/components/internalLinking.vue'));
const EditContentProposal = defineAsyncComponent(() => import('@/components/editContentProposal.vue'));
const SchemaMarkup = defineAsyncComponent(() => import('@/components/schemaMarkup.vue'));

const route = useRoute();
const { resolveClient } = useApolloClient();
const apolloClient = resolveClient();

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
  data: null,
  loading: true,
  error: null,
  headings: [],
  structuredContent: []
});

// Global linked words set
const globalLinkedWords = ref(new Set());

// Active tooltip state
const activeTooltip = ref(null);

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
const processPostContent = async () => {
  const content = post.data.content;
  const cheerio = await import('cheerio');
  const $ = cheerio.load(content);
  const headings = [];
  const sections = [];
  let currentSection = null;

  $('h3, p, ol, ul').each(function(i, elem) {
    const $elem = $(elem);
    if ($elem.is('h3')) {
      if (currentSection) sections.push(currentSection);
      const title = $elem.text().trim();
      headings.push(title);
      currentSection = {
        title,
        content: '',
        className: `post-section-${title.toLowerCase().replace(/[\s,\'\`]+/g, '-').replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')}`
      };
    } else {
      if ($elem.is('p') && $elem.text().trim() === "Riferimenti") {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: "Riferimenti",
          content: '',
          className: 'post-section-riferimenti'
        };
      } else if (currentSection) {
        currentSection.content += $.html($elem);
      }
    }
  });

  if (currentSection) sections.push(currentSection);

  post.headings = headings;
  post.structuredContent = sections;
};

// Fetch post data
const fetchPostData = async () => {
  const slug = Array.isArray(route.params.uri) ? route.params.uri[0] : route.params.uri;
  try {
    post.loading = true;
    const { data } = await apolloClient.query({
      query: FETCH_POST_BY_SLUG,
      variables: { slug }
    });

    if (data?.postBy) {
      post.data = data.postBy;
      await nextTick();
      await processPostContent();
    } else {
      throw new Error('Post not found');
    }
  } catch (err) {
    post.error = err;
  } finally {
    post.loading = false;
  }
};

// Update global linked words
const updateGlobalLinkedWords = (newWords) => {
  newWords.forEach(word => globalLinkedWords.value.add(word));
};

// Compute all headings
const allHeadings = computed(() => {
  const staticHeadings = ["Proprietà terapeutiche", "Nome scientifico", "Parti usate", "Nome comune", "Fitochimica"];
  return [...staticHeadings, ...post.headings];
});

// Parse comma-separated string into array
const parseStringToArray = (str) => str?.split(/[\s]*[;,][\s]*/).filter(Boolean) || [];

// Computed properties for parsed arrays
const partiUsateArray = computed(() => parseStringToArray(post.data?.partiUsate));
const nomeComuneArray = computed(() => parseStringToArray(post.data?.nomeComune));

// Tooltip interaction functions
const showTooltip = (tagId) => activeTooltip.value = tagId;
const hideTooltip = () => activeTooltip.value = null;
const toggleTooltip = (tagId) => activeTooltip.value = activeTooltip.value === tagId ? null : tagId;

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
const handleClickOutside = (event) => {
  if (activeTooltip.value !== null && !event.target.closest('.tooltip-custom')) {
    hideTooltip();
  }
};

// Smooth scroll function
const smoothScroll = (targetId) => {
  const targetElement = document.querySelector(targetId);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Lifecycle hooks
onMounted(() => {
  fetchPostData();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.post-info-section, .post-index-section {
  background: rgb(245,245,245);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 100%);
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