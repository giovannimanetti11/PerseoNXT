<template>
  <section class="posts-page-section py-14 w-11/12 m-auto rounded-2xl">
    <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Piante medicinali</h1>
    <Searchfield />
    <div v-if="loading" class="flex justify-center text-center w-full items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
    </div>
    <div v-else-if="error">Errore nel caricamento dei dati.</div>
    <div v-else-if="posts.length" class="flex justify-center mt-14">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <div v-for="(posts, letter) in groupedPosts" :key="letter" class="mb-6 flex flex-row ml-4 md:ml-0">
          <div class="letter-heading flex text-xl font-bold w-16 h-16 rounded-full bg-celeste text-center"><span class="m-auto content-center text-white">{{ letter }}</span></div>
          <ul class="ml-4 flex flex-col flex-wrap gap-4">
            <li v-for="post in posts" :key="post.id" class="flex flex-row">
              <nuxt-link :to="`/${post.slug}`" class="text-black hover:text-blu">
                <h2>{{ post.title }}</h2>
                <h3 class="italic">{{ post.nomeScientifico }}</h3>
              </nuxt-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-else class="flex justify-center text-center w-full items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
    </div>
  </section>
  <Contacts />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import Searchfield from '~/components/searchfield.vue';
import Contacts from "~/components/contacts.vue";

const posts = ref([]);
const loading = ref(true);
const error = ref(null);

const FETCH_ALL_POSTS = gql`
  query FetchAllPosts {
    posts(first: 1000) {
      nodes {
        id
        title
        nomeScientifico
        slug
      }
    }
  }
`;

const { result, loading: queryLoading, error: queryError } = useQuery(FETCH_ALL_POSTS);

watch(result, (newResult) => {
  if (newResult && newResult.posts) {
    posts.value = newResult.posts.nodes;
  } else {
    console.error("Errore o struttura dati inattesa:", newResult);
  }
});

watch(queryLoading, (newLoading) => {
  loading.value = newLoading;
});

watch(queryError, (newError) => {
  if (newError) {
    console.error('GraphQL query error:', newError);
    error.value = 'Si è verificato un errore durante il caricamento dei dati.';
  }
});

const groupedPosts = computed(() => {
  const groups = {};
  posts.value.forEach(post => {
    const letter = post.title.charAt(0).toUpperCase();
    if (!groups[letter]) {
      groups[letter] = [];
    }
    groups[letter].push(post);
  });
  return Object.fromEntries(
    Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  );
});

useHead({
  title: 'Piante medicinali'
})
</script>

<style scoped>
.posts-page-section {
  background: rgb(224,237,253);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
}
</style>