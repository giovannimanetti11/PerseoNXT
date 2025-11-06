<template>
  <section class="posts-page-section py-14 w-11/12 m-auto rounded-2xl">
    <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Piante medicinali</h1>
    <Searchfield />
    <div v-if="pending" class="flex justify-center text-center w-full items-center h-64" role="status" aria-live="polite">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
      <span class="sr-only">Caricamento in corso...</span>
    </div>
    <div v-else-if="error" class="text-center mt-8" role="alert" aria-live="polite">
      <div class="max-w-lg mx-auto bg-white p-6 rounded-lg shadow text-left">
        <p class="text-2xl font-semibold text-black mb-2">Ops — problema nel caricamento</p>
        <p class="text-sm text-gray-600 mb-4">
          Sembra ci sia stato un problema nel recuperare i dati. Prova a ricare la pagina o contattaci se il problema persiste.
        </p>
        <div class="flex justify-center gap-3">
          <button
            @click="refresh"
            class="px-4 py-2 bg-blu text-white rounded-md hover:opacity-90 focus:outline-none"
            aria-label="Riprova a caricare i contenuti"
          >
            Ricarica
          </button>
          <NuxtLink
            to="/contact"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            Contattaci
          </NuxtLink>
        </div>
      </div>
    </div>
    <div v-else-if="posts.length" class="flex justify-center mt-14">
      <div class="grid grid-cols-1 px-2 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <div v-for="(posts, letter) in groupedPosts" :key="letter" class="mb-6 flex flex-row ml-4 md:ml-0">
          <div class="letter-heading flex items-center justify-center text-xl font-bold w-16 h-16 min-w-16 min-h-16 rounded-full bg-celeste text-white">{{ letter }}</div>
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
import { useGraphQL } from '~/composables/useGraphQL';
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

const FETCH_ALL_POSTS = `
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

const { query } = useGraphQL();

const fetchPostsWithRetry = async (maxRetries = 2, baseDelay = 300) => {
  let attempt = 0;
  const isFetchError = (err: any) => {
    // try to extract common status field variants
    return err?.response?.status || err?.status || (err?.data && err.data.status) || null;
  };

  while (attempt <= maxRetries) {
    try {
      // Primary attempt using existing composable
      const data = await query(FETCH_ALL_POSTS);
      return data.posts.nodes;
    } catch (err: any) {
      const status = isFetchError(err);
      console.error(`Attempt ${attempt + 1} - Error fetching posts:`, err);

      // If 403, try a fallback using $fetch and include credentials (useful for cookie-based auth / CSRF)
      if (status === 403) {
        try {
          console.warn('Received 403, trying fallback fetch with credentials (include).');
          const fallback = await $fetch('/api/graphql', {
            method: 'POST',
            body: { query: FETCH_ALL_POSTS },
            credentials: 'include'
          });
          // GraphQL responses may wrap data differently; normalize:
          return fallback?.data?.posts?.nodes ?? fallback?.posts?.nodes ?? fallback;
        } catch (fallbackErr) {
          console.error('Fallback fetch also failed:', fallbackErr);
          // If fallback fails and we've exhausted retries, throw final error below
        }
      }

      // If we've exhausted retries, rethrow to let useAsyncData handle error state
      attempt++;
      if (attempt > maxRetries) {
        throw err;
      }

      // Exponential backoff before retrying
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  // Fallback empty array if somehow loop exits
  return [];
};

const { data: posts, pending, error } = await useAsyncData<Post[]>(
  'allPosts',
  async () => {
    try {
      return await fetchPostsWithRetry(3, 300);
    } catch (err) {
      console.error('Final error fetching posts:', err);
      // Throw a controlled error message for the UI
      throw new Error('Failed to fetch posts');
    }
  },
  {
    server: true,  // Force SSR only - prevents client-side refetch
    lazy: false,
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

const refresh = () => {
  if (process.client) {
    // Soft reload to re-run client fetches; fallback to hard reload
    try {
      window.location.reload();
    } catch {
      // noop
    }
  }
}
</script>

<style scoped>
.posts-page-section {
  background: rgb(224,237,253);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
}
</style>