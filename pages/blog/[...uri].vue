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
      <section class="post-info-section flex flex-col md:flex-row py-20 px-2 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
        <!-- Information container -->
        <div class="w-full md:w-3/5 md:mt-28 container mx-auto px-2 print:mt-8 print:px-0 order-2 md:order-1">
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

        <!-- Featured image container -->
        <div class="w-full md:w-2/5 md:mt-28 flex flex-col order-1 md:order-2 mb-8 md:mb-0">
          <div class="md:sticky md:top-24">
            <NuxtImg
              v-if="featuredImage"
              :src="featuredImage.sourceUrl"
              :alt="featuredImage.altText"
              class="w-auto m-auto text-center h-auto rounded-2xl object-cover max-h-48"
              width="300"
              height="200"
              format="webp"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <!-- Index section (only shown if there are headings) -->
      <section v-if="headings.length > 0" class="post-index-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full">
        <div class="font-bold text-xl md:text-2xl flex items-center">
          <Icon name="ic:twotone-list" class="text-2xl md:text-3xl text-black rounded-full mr-2" aria-hidden="true" /> 
          <h2 id="table-of-contents">Indice</h2>
        </div>
        <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4 print:gap-0 print:mt-2" aria-labelledby="table-of-contents">
          <li v-for="(heading, index) in headings" :key="index" class="text-center py-2 md:py-4 px-2 md:px-4 bg-verde text-white rounded-xl text-xs md:text-sm hover:bg-celeste cursor-pointer w-full sm:w-2/5 md:w-1/5 flex-grow-0 flex-shrink-0">
            <a :href="'#section' + (index + 1)" class="flex items-center group" @click.prevent="smoothScroll('#section' + (index + 1))">
              <div class="circle flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white text-verde rounded-full mr-1 md:mr-2 text-sm md:text-lg font-bold group-hover:text-celeste">{{ index + 1 }}</div>
              <span class="text-xs md:text-sm">{{ heading }}</span>
            </a>
          </li>
        </ul>
      </section>

      <!-- Introduction section (without numbering) -->
      <section v-if="introSection" class="post-content-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full">
        <div class="mt-4">
          <InternalLinking 
            :content="introSection.content"
            :current-slug="blogPost.slug"
            :global-linked-words="globalLinkedWords"
            @update:globalLinkedWords="updateGlobalLinkedWords"
          />
        </div>
      </section>

      <!-- Numbered content sections -->
      <section v-for="(section, index) in sections"
               :class="['post-content-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full', section.className]"
               :id="'section' + (index + 1)"
               :key="section.title">
        <div class="flex items-center space-x-4" v-if="section.title !== 'Riferimenti'">
          <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold" aria-hidden="true">
            {{ index + 1 }}
          </div>
          <h3 class="text-xl md:text-2xl">{{ section.title }}</h3>
        </div>
        <h3 v-else class="text-xl md:text-2xl mb-4">{{ section.title }}</h3>
        
        <div class="mt-4">
          <InternalLinking 
            :content="section.content"
            :current-slug="blogPost.slug"
            :global-linked-words="globalLinkedWords"
            @update:globalLinkedWords="updateGlobalLinkedWords"
          />
        </div>
      </section>

      <EditContentProposal :sections="headings" />
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

// Component imports
const BlogInfo = defineAsyncComponent(() => import('~/components/blog/bloginfo.vue'));
const Breadcrumbs = defineAsyncComponent(() => import('~/components/breadcrumbs.vue'));
const InternalLinking = defineAsyncComponent(() => import('~/components/internalLinking.vue'));
const EditContentProposal = defineAsyncComponent(() => import('~/components/editContentProposal.vue'));
const SchemaMarkup = defineAsyncComponent(() => import('~/components/schemaMarkup.vue'));

// Core setup
const config = useRuntimeConfig();
const route = useRoute();
const apolloClient = useApolloClient().resolveClient();

// State management
const globalLinkedWords = ref(new Set());
const headings = ref([]);
const sections = ref([]);
const introSection = ref(null);
const yoastData = ref(null);

// GraphQL query definition
const FETCH_BLOG_POST_BY_SLUG = gql`
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

// Fetch blog post data with immediate processing
const { data: blogPost, pending, error } = await useAsyncData(
  'blogPost',
  async () => {
    try {
      const slug = route.params.uri instanceof Array ? route.params.uri[0] : route.params.uri;
      console.log('Fetching blog post:', slug);
      
      const { data } = await apolloClient.query({
        query: FETCH_BLOG_POST_BY_SLUG,
        variables: { slug },
        fetchPolicy: 'no-cache'
      });

      if (!data?.blogPostBy) {
        throw new Error('Post not found');
      }

      return data.blogPostBy;
    } catch (err) {
      console.error('Error fetching blog post:', err);
      throw err;
    }
  },
  { 
    server: true,
    immediate: true
  }
);

// Compute featured image data
const featuredImage = computed(() => {
  if (blogPost.value?.featuredImage?.node) {
    return {
      sourceUrl: blogPost.value.featuredImage.node.sourceUrl,
      altText: blogPost.value.featuredImage.node.altText || ''
    };
  }
  return null;
});

// Process content when blog post data changes
watch(blogPost, async (newPost) => {
  if (newPost?.content) {
    await processContent(newPost.content);
  }
}, { immediate: true });

// Content processing function
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
          className: 'post-section-introduction'
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
          title: headingText,
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
            title: 'Riferimenti',
            content: referenceContent,
            className: 'post-section-riferimenti'
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

// SEO handling
watch(blogPost, (newPost) => {
  if (newPost) {
    const fullUrl = `https://wikiherbalist.com${route.fullPath}`;
    yoastData.value = {
      ...newPost.seo,
      siteName: config.public.siteName,
      url: fullUrl,
      type: 'article',
      image: newPost.seo?.opengraphImage?.sourceUrl || 
             newPost.featuredImage?.node?.sourceUrl || 
             'https://wikiherbalist.com/images/default-og-image.jpg',
      publishedTime: newPost.date,
      modifiedTime: newPost.modified || newPost.date,
      author: newPost.authorName,
    };

    useYoastSeo(yoastData);
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

// Global linked words management
const updateGlobalLinkedWords = (newWords) => {
  newWords.forEach(word => globalLinkedWords.value.add(word));
};

// Reset linked words on route change
watch(() => route.params.uri, () => {
  globalLinkedWords.value.clear();
});
</script>

<style scoped>
.post-info-section, .post-index-section {
  background: rgb(245,245,245);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 100%);
}

.post-content-section {
  background: rgb(224,237,253) !important;
  background: linear-gradient(180deg, rgba(245,245,245,1) 0%, rgba(224,237,253,1) 100%) !important;
}
</style>