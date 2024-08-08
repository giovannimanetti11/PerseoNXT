<template>
  <div id="post" v-if="post.data">
    <section class="post-info-section flex flex-col md:flex-row py-20 px-2 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
      <!-- Slideshow (mobile only) -->
      <div class="md:hidden w-full mb-8">
        <Slideshow 
          v-if="post.data.featuredImage && post.additionalImagesFiltered.length > 0"
          :featured-image="post.data.featuredImage"
          :additional-images="post.additionalImagesFiltered"
        />
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
          <Slideshow 
            v-if="post.data.featuredImage && post.additionalImagesFiltered.length > 0"
            :featured-image="post.data.featuredImage"
            :additional-images="post.additionalImagesFiltered"
          />
        </div>
        <ObservationsMap :nomeScientifico="post.data.nomeScientifico" class="mt-8 md:mt-0 pb-4 w-full m-auto" />
      </div>
    </section>

    <!-- Index section -->
    <section class="post-index-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full">
      <div class="font-bold text-xl md:text-2xl flex items-center">
        <icon name="ic:twotone-list" class="text-2xl md:text-3xl text-black rounded-full mr-2" /> Indice
      </div>
      <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4 print:gap-0 print:mt-2">
        <li v-for="(heading, index) in allHeadings" :key="index" class="text-center py-2 md:py-4 px-2 md:px-4 bg-verde text-white rounded-xl text-xs md:text-sm hover:bg-celeste cursor-pointer w-full sm:w-2/5 md:w-1/5 flex-grow-0 flex-shrink-0">
          <a :href="'#section' + (index + 1)" class="flex items-center group" @click.prevent="smoothScroll('#section' + (index + 1))">
            <div class="circle flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white text-verde rounded-full mr-1 md:mr-2 text-sm md:text-lg font-bold group-hover:text-celeste">{{ index + 1 }}</div>
            <span class="text-xs md:text-sm">{{ heading }}</span>
          </a>
        </li>
      </ul>
    </section>

    <!-- Start of "static" sections -->
    <section class="post-section-proprieta flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full" id="section1" v-if="post.data.tags && post.data.tags.nodes.length > 0">
      <div class="flex items-center">
        <div class="circle flex items-center justify-center w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5">1</div>
        <h3 class="text-xl md:text-2xl mt-1 md:mt-0">Proprietà terapeutiche</h3>
      </div>
      <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4">
        <li v-for="tag in post.data.tags.nodes" :key="tag.id" 
            class="relative hover:bg-blu hover:text-white text-center py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full sm:w-2/5 md:w-1/5 flex-grow-0 flex-shrink-0"
            @click="toggleTooltip(tag.id)"
            @mouseenter="showTooltip(tag.id)">
          {{ tag.name }}
          <div v-if="activeTooltip === tag.id" 
               class="tooltip-custom fixed z-50 bg-white border border-blu rounded-lg shadow-lg text-sm text-gray-700"
               :style="tooltipStyle"
               @click.stop>
            <div class="p-6">
              <h4 class="text-2xl font-bold text-blu text-left mb-4">{{ tag.name }}</h4>
              <button @click.stop="hideTooltip" class="absolute top-2 right-2 text-blu hover:text-celeste">
                <Icon name="mdi:close" class="text-xl" />
              </button>
              <p v-html="tag.description" class="font-normal text-left"></p>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <div class="flex flex-col md:flex-row w-11/12 mx-auto print:w-full gap-4 md:gap-8">
      <div class="flex flex-col w-full md:w-1/2 mx-auto print:w-full">
        <section class="post-section-nome-scientifico flex flex-col w-full py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 print:py-2 print:px-0" id="section2" v-if="post.data.nomeScientifico">
          <div class="flex items-center">
            <div class="circle flex items-center justify-center mt-1 md:mt-0 w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5">2</div>
            <h3 class="text-xl md:text-2xl mt-1 md:mt-0">Nome scientifico</h3>
          </div>
          <p class="text-center italic mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full md:w-2/5">{{ post.data.nomeScientifico }}</p>
        </section>
        <section class="post-section-parti-usate flex flex-col w-full py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 print:py-2 print:px-0" id="section3" v-if="post.data.partiUsate">
          <div class="flex items-center">
            <div class="circle flex items-center justify-center mt-1 md:mt-0 w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5">3</div>
            <h3 class="text-xl md:text-2xl mt-1 md:mt-0">Parti usate</h3>
          </div>
          <div class="flex flex-wrap gap-2 md:gap-4">
            <p v-for="parte in partiUsateArray" :key="parte" class="text-center mt-2 md:mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full sm:w-2/5">{{ parte }}</p>
          </div>
        </section>
      </div>
      <div class="post-section-nome-comune flex flex-col w-full md:w-1/2 py-10 md:py-20 px-4 md:px-10 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full" id="section4" v-if="post.data.nomeComune">
        <div class="flex items-center">
          <div class="circle flex items-center justify-center mt-1 md:mt-0 w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5">4</div>
          <h3 class="text-xl md:text-2xl mt-1 md:mt-0">Nome comune</h3>
        </div>
        <div class="flex flex-wrap gap-2 md:gap-4">
          <p v-for="nome in nomeComuneArray" :key="nome" class="text-center mt-2 md:mt-4 py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full sm:w-2/5">{{ nome }}</p>
        </div>
      </div>
    </div>
    <section class="post-section-fitochimica flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full" id="section5" v-if="post.data.costituenti">
      <div class="flex items-center">
        <div class="circle flex items-center justify-center mt-1 md:mt-0 w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5">5</div>
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
        <div class="circle flex items-center justify-center mt-1 md:mt-0 w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-4 mr-2 bg-blu text-white rounded-full text-base md:text-lg font-bold print:mb-0 print:mr-0.5">{{ 5 + index + 1 }}</div>
        <h3 class="text-xl md:text-2xl mt-1 md:mt-0">{{ section.title }}</h3>
      </div>
      <h3 v-else class="text-xl md:text-2xl mb-4 mt-1 md:mt-0">{{ section.title }}</h3>
      <InternalLinking 
        :content="section.content" 
        :current-slug="post.data?.slug || ''"
        :global-linked-words="globalLinkedWords"
      />
    </section>
    <EditContentProposal :sections="allHeadings" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import cheerio from 'cheerio';
import gql from 'graphql-tag';
import Slideshow from '@/components/posts/slideshow.vue';
import PostInfo from '@/components/posts/postinfo.vue';
import ObservationsMap from '@/components/posts/observationsMap.vue';
import InternalLinking from '@/components/internalLinking.vue';
import EditContentProposal from '@/components/editContentProposal.vue';
import { useHead } from '#app';

// State management for post details and loading state
const route = useRoute();
const post = reactive({
  data: null,
  loading: true,
  additionalImagesFiltered: [],
  headings: [],
  structuredContent: [],
  error: null
});

// GraphQL query to fetch post data by URI
const FETCH_POST_BY_URI = gql`
  query FetchPostByUri($uri: String!) {
    postBy(uri: $uri) {
      id
      title
      nomeScientifico
      partiUsate
      nomeComune
      costituenti
      authorName
      date
      content
      slug
      tags {
        nodes {
          id
          name
          description
        }
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
        caption
        url
      }
      seo {
        title
        metaDesc
        focuskw
        metaKeywords
        metaRobotsNoindex
        metaRobotsNofollow
        opengraphTitle
        opengraphDescription
        opengraphImage {
          sourceUrl
        }
        twitterTitle
        twitterDescription
        twitterImage {
          sourceUrl
        }
        canonical
      }
    }
  }
`;

// Watches post data to update document head with SEO tags dynamically
watch(() => post.data, () => {
  if (post.data && post.data.seo) {
    const seo = post.data.seo;
    
    useHead({
      title: seo.title,
      meta: [
        { name: 'description', content: seo.metaDesc },
        { name: 'keywords', content: seo.metaKeywords },
        { name: 'robots', content: `${seo.metaRobotsNoindex},${seo.metaRobotsNofollow}` },
        { property: 'og:title', content: seo.opengraphTitle || seo.title },
        { property: 'og:description', content: seo.opengraphDescription || seo.metaDesc },
        { property: 'og:image', content: seo.opengraphImage?.sourceUrl },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: seo.canonical },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: seo.twitterTitle || seo.opengraphTitle || seo.title },
        { name: 'twitter:description', content: seo.twitterDescription || seo.opengraphDescription || seo.metaDesc },
        { name: 'twitter:image', content: seo.twitterImage?.sourceUrl || seo.opengraphImage?.sourceUrl },
        { name: 'article:published_time', content: post.data.date },
      ],
      link: [
        { rel: 'canonical', href: seo.canonical }
      ],
      script: [
        {
          type: 'application/ld+json'
        }
      ]
    });
  }
});

// Fetch post data on component mount and handle result or error
const fetchPost = async () => {
  const uri = route.params.uri instanceof Array ? route.params.uri[0] : route.params.uri;
  const { result, loading, error } = useQuery(FETCH_POST_BY_URI, { uri });

  watch([result, loading, error], async ([newResult, newLoading, newError]) => {
    if (newError) {
      console.error('Error fetching post:', newError);
      post.error = newError;
    } else if (!newLoading && newResult?.postBy) {
      post.data = newResult.postBy;
      post.loading = false;

      if (post.data.additionalImages) {
        post.additionalImagesFiltered = post.data.additionalImages.filter(img => img && img.url);
      }

      await nextTick();
      processPostContent();
    }
  });
};

const globalLinkedWords = ref(new Set());

const staticHeadings = ["Proprietà terapeutiche", "Nome scientifico", "Parti usate", "Nome comune", "Fitochimica"];

const allHeadings = computed(() => {
  return [...staticHeadings, ...post.headings];
});

// Process post content to extract headings and sections
const processPostContent = () => {
  const content = post.data.content;
  const $ = cheerio.load(content);
  const headings = [];
  const sections = [];
  let currentSection = null;

  $('h3, p, ol, ul').each(function(i, elem) {
    const $elem = $(elem);
    if ($elem.is('h3')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      const title = $elem.text().trim();
      headings.push(title);
      currentSection = {
        title: title,
        content: '',
        className: `post-section-${title.toLowerCase().replace(/[\s,\'\`]+/g, '-').replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')}`
      };
    } else {
      if ($elem.is('p') && $elem.text().trim() === "Riferimenti") {
        if (currentSection) {
          sections.push(currentSection);
        }
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

  if (currentSection) {
    sections.push(currentSection);
  }

  post.headings = headings;
  post.structuredContent = sections;
};

const smoothScroll = (target) => {
  const location = document.querySelector(target);
  if (location) {
    window.scrollTo({
      top: location.offsetTop,
      behavior: "smooth"
    });
  }
};

// Computed properties for reactive UI elements
const partiUsateArray = computed(() => {
  if (post.data && post.data.partiUsate) {
    return post.data.partiUsate.split(/[\s]*[;,][\s]*/).filter(parte => parte.length > 0);
  }
  return [];
});

const nomeComuneArray = computed(() => {
  if (post.data && post.data.nomeComune) {
    return post.data.nomeComune.split(/[\s]*[;,][\s]*/).filter(nome => nome.length > 0);
  }
  return [];
});

onMounted(() => {
  console.log('Component mounted, fetching post...');
  fetchPost();
});

watch(() => post.data, () => {
  if (post.data) {
    nextTick(() => {
      processPostContent();
      globalLinkedWords.value.clear(); // Reset globalLinkedWords for each new post
    });
  }
});

// Event handlers for tooltip interaction
const activeTooltip = ref(null);

const showTooltip = (tagId) => {
  activeTooltip.value = tagId;
};

const hideTooltip = () => {
  activeTooltip.value = null;
};

const toggleTooltip = (tagId) => {
  if (activeTooltip.value === tagId) {
    hideTooltip();
  } else {
    showTooltip(tagId);
  }
};

const tooltipStyle = computed(() => {
  return {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto'
  };
});

const handleClickOutside = (event) => {
  if (activeTooltip.value !== null && !event.target.closest('.tooltip-custom')) {
    hideTooltip();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.post-info-section {
  background: rgb(245,245,245);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 100%);
}

.post-index-section, .post-section-proprieta, .post-section-botanica, .post-section-raccolta, 
.post-section-modalita-d’uso, .post-section-utilizzo-tradizionale, 
.post-section-ricerca-scientifica, .post-section-avvertenze-e-controindicazioni, 
.post-section-parti-usate, .post-section-nome-comune, .post-section-nome-scientifico,
.post-section-fitochimica, .post-section-riferimenti {
  background: rgb(224,237,253);
  background: linear-gradient(180deg, rgba(245,245,245,1) 0%, rgba(224,237,253,1) 100%);
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