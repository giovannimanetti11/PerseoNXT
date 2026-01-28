<template>
  <section class="blog-page-section py-14 w-11/12 m-auto rounded-2xl">
    <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Blog</h1>
    <Searchfield />
    <div v-if="pending" class="flex justify-center text-center w-full items-center h-64" role="status" aria-live="polite">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
      <span class="sr-only">Caricamento in corso...</span>
    </div>
    <ErrorState
      v-else-if="error"
      type="error"
      title="Impossibile caricare il blog"
      message="Si è verificato un problema nel recuperare gli articoli. Prova a ricaricare la pagina."
    />
    <template v-else>
      <div v-if="featuredPost" class="featured-post flex flex-col mb-6 w-11/12 md:w-2/3 m-auto mt-24 bg-white rounded-2xl p-4">
        <div class="flex flex-col md:flex-row w-full">
          <NuxtImg 
            :src="featuredPost.featuredImage.node.sourceUrl" 
            :alt="featuredPost.featuredImage.node.altText" 
            class="mr-4 w-full md:w-1/2 h-64 object-cover rounded-lg mb-4" 
            width="400"
            height="256"
            loading="eager"
          />
          <div class="flex flex-col w-full md:w-1/2 ml-4">
            <h2 class="text-3xl font-semibold text-left mb-2">{{ featuredPost.title }}</h2>
            <p class="text-gray-600 mb-4">di {{ featuredPost.authorName }} - {{ formatDate(featuredPost.date) }}</p>
            <div v-html="sanitizeHtml(featuredPost.excerpt)" class="text-gray-700 mb-4 pb-12"></div>
          </div>
        </div>
        <NuxtLink :to="'/blog/' + featuredPost.slug" class="m-auto align-center bg-verde border text-white text-center w-full md:w-1/4 rounded-xl py-2 px-8 m-auto hover:border-verde hover:border hover:text-verde hover:bg-white">
          Leggi di più
        </NuxtLink>
      </div>
      <div v-if="otherPosts.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-11/12 md:w-2/3 m-auto">
        <div v-for="post in otherPosts" :key="post.databaseId" class="bg-white rounded-lg shadow-lg px-6 pb-20 pt-6 relative">
          <NuxtImg 
            :src="post.featuredImage.node.sourceUrl" 
            :alt="post.featuredImage.node.altText" 
            class="w-full h-48 object-cover rounded-lg mb-4" 
            width="300"
            height="192"
            loading="lazy"
          />
          <h3 class="text-2xl font-semibold mb-2">{{ post.title }}</h3>
          <p class="text-gray-600 mb-4">{{ post.authorName }} - {{ formatDate(post.date) }}</p>
          <NuxtLink :to="'/blog/' + post.slug" class="bg-verde block border absolute bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 md:w-4/5 text-white text-center rounded-xl py-2 hover:border-verde hover:border hover:text-verde hover:bg-white">
            Leggi di più
          </NuxtLink>
        </div>
      </div>
    </template>
  </section>
  <Contacts />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSanitize } from '~/composables/useSanitize';
import { useGraphQL } from '~/composables/useGraphQL';
import { useAsyncData } from '#app';
import Searchfield from '~/components/searchfield.vue';
import Contacts from "~/components/contacts.vue";

const { sanitizeHtml } = useSanitize();
const { query } = useGraphQL();

interface BlogPost {
  title: string;
  slug: string;
  authorName: string;
  date: string;
  featuredImage: {
    node: {
      sourceUrl: string;
      altText: string;
    }
  };
  excerpt: string;
  databaseId: number;
}

const FETCH_BLOG_POSTS = `
  query FETCH_BLOG_POSTS {
    blogPosts(first: 50, where: {orderby: {field: DATE, order: DESC}}) {
      nodes {
        title
        slug
        authorName
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        excerpt
        databaseId
      }
    }
  }
`;

// Fetch blog posts with useAsyncData for SSR
const { data: blogPosts, pending, error } = await useAsyncData<BlogPost[]>(
  'blogPosts',
  async () => {
    try {
      const data = await query(FETCH_BLOG_POSTS);

      // Transform the data
      return data.blogPosts.nodes.map((post: any) => ({
        ...post,
        featuredImage: {
          node: {
            sourceUrl: post.featuredImage?.node?.sourceUrl || '/placeholder-image.jpg',
            altText: post.featuredImage?.node?.altText || post.title
          }
        }
      }));
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      throw new Error('Failed to fetch blog posts');
    }
  },
  {
    server: true,  // Force SSR only - prevents client-side refetch
    lazy: false
  }
);

// Computed properties for UI
const featuredPost = computed<BlogPost | null>(() => blogPosts.value?.[0] || null);
const otherPosts = computed<BlogPost[]>(() => blogPosts.value?.slice(1) || []);

// Format date helper
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Set page metadata
const baseUrl = 'https://wikiherbalist.com'

useHead({
  title: 'Blog',
  meta: [
    { name: 'description', content: 'Articoli su fitoterapia, erbe medicinali e salute naturale. Scopri gli ultimi studi e approfondimenti sulle piante officinali.' },
    { property: 'og:title', content: 'Blog - Wikiherbalist' },
    { property: 'og:description', content: 'Articoli su fitoterapia, erbe medicinali e salute naturale. Scopri gli ultimi studi e approfondimenti.' },
    { property: 'og:url', content: `${baseUrl}/blog` },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: 'Blog - Wikiherbalist' },
    { name: 'twitter:description', content: 'Articoli su fitoterapia, erbe medicinali e salute naturale.' }
  ],
  link: [
    { rel: 'canonical', href: `${baseUrl}/blog` }
  ]
})
</script>

<style scoped>
.blog-page-section {
  background: rgb(224,237,253);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
}
</style>