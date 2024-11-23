<template>
  <section class="posts-page-section py-14 w-11/12 m-auto rounded-2xl">
    <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Piante medicinali</h1>
    <Searchfield />
    <div v-if="pending" class="flex justify-center text-center w-full items-center h-64" role="status" aria-live="polite">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
      <span class="sr-only">Caricamento in corso...</span>
    </div>
    <div v-else-if="error" class="text-red-500 text-center" role="alert">
      Si è verificato un errore nel caricamento dei dati. Riprova più tardi.
    </div>
    <div v-else-if="posts.length" class="flex justify-center mt-14">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <div v-for="(posts, letter) in groupedPosts" :key="letter" class="mb-6 flex flex-row ml-4 md:ml-0">
          <div class="letter-heading flex text-xl font-bold w-16 h-16 rounded-full bg-celeste text-center"><span class="m-auto content-center text-white">{{ letter }}</span></div>
          <ul class="ml-4 flex flex-col flex-wrap gap-4">
            <li v-for="post in posts" :key="post.id" class="flex flex-row">
              <NuxtLink :to="`/${post.slug}`" class="text-black hover:text-blu">
                <h2>{{ post.title }}</h2>
                <h3 class="italic">{{ post.nomeScientifico }}</h3>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-else class="text-center mt-8" role="status" aria-live="polite">
      Nessuna pianta medicinale trovata.
    </div>
  </section>
  <Contacts />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAsyncData } from '#app';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import Searchfield from '~/components/searchfield.vue';
import Contacts from "~/components/contacts.vue";

interface Post {
  id: string;
  title: string;
  nomeScientifico: string;
  slug: string;
}

interface GroupedPosts {
  [key: string]: Post[];
}

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

const { resolveClient } = useApolloClient();
const apolloClient = resolveClient();

const { data: posts, pending, error } = await useAsyncData<Post[]>(
  'allPosts',
  async () => {
    try {
      const { data } = await apolloClient.query({
        query: FETCH_ALL_POSTS
      });
      return data.posts.nodes;
    } catch (err) {
      console.error('Error fetching posts:', err);
      throw new Error('Failed to fetch posts');
    }
  },
  {
    transform: (result) => {
      return result?.map((post: any) => ({
        id: post.id,
        title: post.title,
        nomeScientifico: post.nomeScientifico,
        slug: post.slug
      })) || [];
    }
  }
);

const groupedPosts = computed<GroupedPosts>(() => {
  const groups: GroupedPosts = {};
  const sortedPosts = posts.value?.sort((a, b) => a.title.localeCompare(b.title)) || [];
  sortedPosts.forEach(post => {
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