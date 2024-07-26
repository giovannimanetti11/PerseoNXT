<template>
  <section class="blog-page-section py-14 w-11/12 m-auto rounded-2xl">
    <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Blog</h1>
    <Searchfield />
    <div v-if="loading" class="flex justify-center py-20">
      <icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste text-center mt-10 mx-auto" />
    </div>
    <div v-if="error" class="text-red-500 text-center">
      Errore nel caricamento dei dati.
    </div>
    <div v-if="featuredPost" class="featured-post flex flex-col mb-6 w-11/12 md:w-2/3 m-auto mt-24 bg-white rounded-2xl p-4">
      <div class="flex flex-col md:flex-row w-full">
        <NuxtImg :src="featuredPost.featuredImage.node.sourceUrl" :alt="featuredPost.featuredImage.node.altText" class="mr-4 w-full md:w-1/2 h-64 object-cover rounded-lg mb-4" />
        <div class="flex flex-col w-full md:w-1/2 ml-4">
          <h2 class="text-3xl font-semibold text-left mb-2">{{ featuredPost.title }}</h2>
          <p class="text-gray-600 mb-4">di {{ featuredPost.authorName }} - {{ formatDate(featuredPost.date) }}</p>
          <div v-html="featuredPost.excerpt" class="text-gray-700 mb-4 pb-12"></div>
        </div>
      </div>
      <nuxt-link :to="'/blog/' + featuredPost.slug" class="m-auto align-center bg-verde border text-white text-center w-full md:w-1/4 rounded-xl py-2 px-8 m-auto hover:border-verde hover:border hover:text-verde hover:bg-white">Leggi di più</nuxt-link>
    </div>
    <div v-if="otherPosts.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-11/12 md:w-2/3 m-auto">
      <div v-for="post in otherPosts" :key="post.databaseId" class="bg-white rounded-lg shadow-lg px-6 pb-20 pt-6 relative">
        <NuxtImg :src="post.featuredImage.node.sourceUrl" :alt="post.featuredImage.node.altText" class="w-full h-48 object-cover rounded-lg mb-4" />
        <h3 class="text-2xl font-semibold mb-2">{{ post.title }}</h3>
        <p class="text-gray-600 mb-4">{{ post.authorName }} - {{ formatDate(post.date) }}</p>
        <nuxt-link :to="'/blog/' + post.slug" class="bg-verde block border absolute bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 md:w-4/5 text-white text-center rounded-xl py-2 hover:border-verde hover:border hover:text-verde hover:bg-white">Leggi di più</nuxt-link>
      </div>
    </div>
  </section>
  <Contacts />
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import Searchfield from '~/components/searchfield.vue';
import Contacts from "~/components/contacts.vue";

const FETCH_BLOG_POSTS = gql`
  query FETCH_BLOG_POSTS {
    blogPosts(first: 50) {
      nodes {
        title
        slug
        authorName
        date
        featuredImage {
          node {
            sourceUrl
            altText
            caption
          }
        }
        excerpt
        databaseId
      }
    }
  }
`;

const { result, loading: queryLoading, error: queryError } = useQuery(FETCH_BLOG_POSTS);

const featuredPost = ref(null);
const otherPosts = ref([]);
const loading = ref(false);
const error = ref(null);

onMounted(() => {
  watch(result, (newResult) => {
    if (newResult && newResult.blogPosts && newResult.blogPosts.nodes.length) {
      featuredPost.value = newResult.blogPosts.nodes[0];
      otherPosts.value = newResult.blogPosts.nodes.slice(1);
    } else {
      console.error("Errore o struttura dati inattesa:", newResult);
    }
  });

  watch(queryLoading, (newLoading) => {
    loading.value = newLoading;
  });

  watch(queryError, (newError) => {
    if (newError) {
      error.value = newError;
    }
  });
});

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
};
</script>

<style scoped>
.blog-page-section {
  background: rgb(224,237,253);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
}
</style>
