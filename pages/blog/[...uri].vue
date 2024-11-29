<template>
  <div v-if="post.loading" class="flex justify-center text-center w-full items-center h-64 mt-12" aria-live="polite" aria-busy="true">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu" aria-label="Caricamento"></div>
  </div>
  <div v-else-if="post.error" role="alert" aria-live="assertive">Si è verificato un errore: {{ post.error.message }}</div>
  <div v-else-if="post.data" id="post">
    <SchemaMarkup :post="post.data" :tag="null" />
    <section class="post-info-section flex flex-col md:flex-row py-20 px-2 md:px-10 w-11/12 mx-auto rounded-2xl print:py-2 print:px-0 print:w-full">
      <!-- Container for post information -->
      <div class="w-full md:w-3/5 md:mt-28 container mx-auto px-2 print:mt-8 print:px-0 order-2 md:order-1">
        <div class="mb-12">
          <Breadcrumbs 
            :currentPageName="post.data.title" 
            parentPath="/blog" 
            parentName="Blog" 
          />
        </div>
        <BlogInfo 
          :title="post.data.title"
          :publishDate="post.data.date"
          :content="post.data.content"
          :authorName="post.data.authorName"
          :revisionData="post.data.revisionData"
        />
      </div>

      <!-- Container for featured image -->
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

    <!-- Index section -->
    <section class="post-index-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full">
      <div class="font-bold text-xl md:text-2xl flex items-center">
        <Icon name="ic:twotone-list" class="text-2xl md:text-3xl text-black rounded-full mr-2" aria-hidden="true" /> 
        <h2 id="table-of-contents">Indice</h2>
      </div>
      <ul class="mt-4 md:mt-8 flex flex-wrap justify-start gap-2 md:gap-4 print:gap-0 print:mt-2" aria-labelledby="table-of-contents">
        <li v-for="(heading, index) in post.headings" :key="index" class="text-center py-2 md:py-4 px-2 md:px-4 bg-verde text-white rounded-xl text-xs md:text-sm hover:bg-celeste cursor-pointer w-full sm:w-2/5 md:w-1/5 flex-grow-0 flex-shrink-0">
          <a :href="'#section' + (index + 1)" class="flex items-center group" @click.prevent="smoothScroll('#section' + (index + 1))">
            <div class="circle flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white text-verde rounded-full mr-1 md:mr-2 text-sm md:text-lg font-bold group-hover:text-celeste">{{ index + 1 }}</div>
            <span class="text-xs md:text-sm">{{ heading }}</span>
          </a>
        </li>
      </ul>
    </section>

    <!-- Introduction section -->
    <section 
      v-if="post.structuredContent[0] && !post.structuredContent[0].title"
      class="post-content-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full post-section-introduction"
    >
      <div class="mt-4">
        <InternalLinking 
          :content="post.structuredContent[0].content" 
          :current-slug="post.data?.slug || ''"
          :global-linked-words="globalLinkedWords"
          @update:globalLinkedWords="updateGlobalLinkedWords"
        />
      </div>
    </section>

    <!-- Regular sections -->
    <section 
      v-for="(section, index) in sectionsWithoutIntro"
      :key="section.title"
      :class="['post-content-section flex flex-col py-10 md:py-20 px-4 md:px-10 w-11/12 mx-auto rounded-2xl mt-4 print:py-2 print:px-0 print:w-full', section.className]"
      :id="'section' + (index + 1)"
    >
      <div class="flex items-center space-x-4" v-if="section.title !== 'Riferimenti'">
        <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold" aria-hidden="true">
          {{ index + 1 }}
        </div>
        <h3 class="text-xl md:text-2xl">{{ section.title }}</h3>
      </div>
      <h3 v-else class="text-xl md:text-2xl mb-4">{{ section.title }}</h3>
      <InternalLinking 
        :content="section.content" 
        :current-slug="post.data?.slug || ''"
        :global-linked-words="globalLinkedWords"
        @update:globalLinkedWords="updateGlobalLinkedWords"
      />
    </section>

    <EditContentProposal :sections="post.headings" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick, computed, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { useYoastSeo } from '~/composables/useYoastSeo';
import { useRuntimeConfig } from '#app';

const Breadcrumbs = defineAsyncComponent(() => import('@/components/breadcrumbs.vue'));
const BlogInfo = defineAsyncComponent(() => import('@/components/blog/bloginfo.vue'));
const InternalLinking = defineAsyncComponent(() => import('@/components/internalLinking.vue'));
const EditContentProposal = defineAsyncComponent(() => import('@/components/editContentProposal.vue'));
const SchemaMarkup = defineAsyncComponent(() => import('@/components/schemaMarkup.vue'));

const config = useRuntimeConfig();
const route = useRoute();
const post = reactive({
  data: null,
  loading: true,
  headings: [],
  structuredContent: [],
  error: null
});

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
  return 'https://wikiherbalist.com/images/default-og-image.jpg';
});

const fetchPost = async () => {
  const slug = route.params.uri instanceof Array ? route.params.uri[0] : route.params.uri;
  const { result, loading, error } = useQuery(FETCH_BLOG_POST_BY_SLUG, { slug });

  watch([result, loading, error], async ([newResult, newLoading, newError]) => {
    if (newError) {
      console.error('Error fetching blog post:', newError);
      post.error = newError;
    } else if (!newLoading && newResult?.blogPostBy) {
      post.data = newResult.blogPostBy;
      post.loading = false;
      await nextTick();
      processPostContent();
    } else if (!newLoading && !newResult?.blogPostBy) {
      console.error('No blog post data found for slug:', slug);
      post.error = new Error('Blog post not found');
    }
  });
};

const globalLinkedWords = ref(new Set());

const updateGlobalLinkedWords = (newWords) => {
  newWords.forEach(word => globalLinkedWords.value.add(word));
};

const sectionsWithoutIntro = computed(() => {
  // Skip the introduction section if it exists
  if (post.structuredContent && post.structuredContent.length > 0 && !post.structuredContent[0].title) {
    return post.structuredContent.slice(1);
  }
  return post.structuredContent;
});

const processContent = async () => {
  if (!post.data || !post.data.content) return;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = post.data.content;

  const headings = [];
  const sections = [];
  
  // Get introduction content (everything before first h3)
  const firstH3 = tempDiv.querySelector('h3');
  if (firstH3) {
    const introNodes = [];
    let currentNode = tempDiv.firstChild;
    
    while (currentNode && currentNode !== firstH3) {
      introNodes.push(currentNode.cloneNode(true));
      currentNode = currentNode.nextSibling;
    }
    
    if (introNodes.length > 0) {
      const introDiv = document.createElement('div');
      introNodes.forEach(node => introDiv.appendChild(node));
      sections.push({
        title: null,
        content: introDiv.innerHTML,
        className: 'post-section-introduction'
      });
    }
  } else {
    // If no h3 exists, all content is introduction
    sections.push({
      title: null,
      content: tempDiv.innerHTML,
      className: 'post-section-introduction'
    });
  }

  // Process regular sections
  let currentSection = null;
  const processNodes = (startNode) => {
    let currentNode = startNode;
    
    while (currentNode) {
      if (currentNode.tagName === 'H3') {
        if (currentSection) {
          sections.push(currentSection);
        }
        const title = currentNode.textContent.trim();
        headings.push(title);
        currentSection = {
          title,
          content: '',
          className: `post-section-${title.toLowerCase().replace(/[\s,\'\`]+/g, '-')
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')}`
        };
      } else if (currentSection) {
        // If it's a "Riferimenti" section starter
        if (currentNode.tagName === 'P' && currentNode.textContent.trim() === 'Riferimenti') {
          sections.push(currentSection);
          currentSection = {
            title: 'Riferimenti',
            content: '',
            className: 'post-section-riferimenti'
          };
        } else {
          currentSection.content += currentNode.outerHTML || '';
        }
      }
      currentNode = currentNode.nextSibling;
    }
  };

  processNodes(firstH3 || tempDiv.firstChild);

  // Add the last section if exists
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

onMounted(() => {
  fetchPost();
});


const yoastData = ref(null);

watch(() => post.data, async (newPostData) => {
  if (newPostData) {
    await nextTick();
    await processContent();
    globalLinkedWords.value.clear();
    
    const fullUrl = `https://wikiherbalist.com${route.fullPath}`;
    
    yoastData.value = {
      ...newPostData.seo,
      siteName: config.public.siteName,
      url: fullUrl,
      type: 'article',
      image: newPostData.seo.opengraphImage?.sourceUrl || featuredImage.value?.sourceUrl || openGraphImage.value,
      publishedTime: newPostData.date,
      modifiedTime: newPostData.modified || newPostData.date,
      author: newPostData.authorName,
    };

    useYoastSeo(yoastData);
  }
}, { immediate: true });


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