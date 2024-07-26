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
      <div class="w-full md:w-2/5 md:mt-40 container mx-auto px-2 print:mt-8 print:px-0 order-2 md:order-1">
        <PostInfo 
          :title="post.data.title"
          :nomeScientifico="post.data.nomeScientifico"
          :publishDate="post.data.date"
          :updateDate="post.data.modified"
          :content="post.data.content"
          :authorName="post.data.authorName"
        />
      </div>

      <!-- Container for slideshow and map (desktop only) -->
      <div class="w-full md:w-3/5 flex flex-col order-3 md:order-2">
        <div class="hidden md:block">
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
        <li v-for="(heading, index) in post.headings" :key="index" class="text-center py-2 md:py-4 px-2 md:px-4 bg-verde text-white rounded-xl text-xs md:text-sm hover:bg-celeste cursor-pointer w-full sm:w-2/5 md:w-1/5 flex-grow-0 flex-shrink-0">
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
        <li v-for="tag in post.data.tags.nodes" :key="tag.name" class="hover:bg-blu hover:text-white text-center py-2 md:py-4 px-2 md:px-4 bg-white text-blu rounded-xl text-xs md:text-sm cursor-pointer w-full sm:w-2/5 md:w-1/5 flex-grow-0 flex-shrink-0">
          {{ tag.name }}
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
      <div v-html="sanitizedContent(section.content)" class="mt-4 text-sm md:text-base"></div>
    </section>
  </div>
</template>

<script setup>
import { reactive, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import cheerio from 'cheerio';
import gql from 'graphql-tag';
import Slideshow from '@/components/posts/slideshow.vue';
import PostInfo from '@/components/posts/postinfo.vue';
import ObservationsMap from '@/components/posts/observationsMap.vue';
import DOMPurify from 'dompurify';

const sanitizedContent = (content) => {
  return DOMPurify.sanitize(content);
};

const route = useRoute();
const post = reactive({
  data: null,
  loading: true,
  additionalImagesFiltered: [],
  headings: [],
  structuredContent: [],
  error: null
});

const smoothScroll = (target) => {
  const location = document.querySelector(target);
  if (location) {
    window.scrollTo({
      top: location.offsetTop,
      behavior: "smooth"
    });
  }
};

// Split partiUsate and nomeComune strings into an array
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

// Define GraphQL query
const FETCH_POST_BY_URI = gql`
  query FetchPostByUri($uri: String!) {
    postBy(uri: $uri) {
      id
      title
      nomeScientifico
      partiUsate
      nomeComune
      tossica
      excerpt
      costituenti
      authorName
      date
      modified
      content
      tags {
        nodes {
          name
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
    }
  }
`;

// Function to fetch and process post data
async function fetchPost() {
  const uri = route.params.uri instanceof Array ? route.params.uri[0] : route.params.uri;
  const { result, loading, error } = useQuery(FETCH_POST_BY_URI, { uri });

  if (error.value) {
    post.error = error.value;
  } else {
    post.data = result.value?.postBy;
    post.loading = false;
  }

  watch(loading, (newLoading) => {
    if (!newLoading && !error.value) {
      post.data = result.value?.postBy;
      if (post.data && post.data.additionalImages) {
        post.additionalImagesFiltered = post.data.additionalImages.filter(img => img && img.url);
      }

      nextTick(() => {
        const content = post.data?.content;
        const $ = cheerio.load(content);
        const dynamicHeadings = [];
        $('h3').each(function() {
          dynamicHeadings.push($(this).text());
        });

        nextTick(() => {
          const staticHeadings = [];
          document.querySelectorAll('#post h3').forEach((element) => {
            const headingText = element.textContent.trim();
            if (!dynamicHeadings.includes(headingText)) {
              staticHeadings.push(headingText);
            }
          });
          post.headings = [...staticHeadings, ...dynamicHeadings];
        });

        const sections = [];
        $('h3, p').each(function() {
          const element = $(this);
          const title = element.text().trim();
          if (element.is('p') && title === "Riferimenti") {
            const contentHtml = $('<div>').append(element.nextAll().clone()).html();
            sections.push({
              title: title,
              content: contentHtml,
              className: `post-section-${title.toLowerCase().replace(/[\s,\'\`]+/g, '-').replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')}`
            });
            return false; // Stop iteration after "Riferimenti"
          } else if (element.is('h3')) {
            const contentHtml = $('<div>').append(element.nextUntil('h3, p:contains("Riferimenti")').clone()).html();
            sections.push({
              title: title,
              content: contentHtml,
              className: `post-section-${title.toLowerCase().replace(/[\s,\'\`]+/g, '-').replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')}`
            });
          }
        });

        post.structuredContent = sections;
      });
    }
  });
}

onMounted(fetchPost);
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
</style>
