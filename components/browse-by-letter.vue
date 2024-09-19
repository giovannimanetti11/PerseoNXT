<!-- New version -->
<template>
  <section class="py-2 w-11/12 mx-auto rounded-2xl alphabet-section">
    <div class="container mx-auto px-0 md:px-4 mt-4">
      <div class="w-full mx-auto flex justify-center mt-8 items-center">
        <button class="mr-2" @click="scrollAlphabet('left')" aria-label="Scorri a sinistra">
          <Icon name="iconamoon:arrow-left-2" class="text-5xl text-celeste hover:text-white hover:bg-verde hover:rounded-full hover:border-verde" />
        </button>
        <div class="flex overflow-hidden alphabet-container" ref="alphabetContainer">
          <button 
            v-for="letter in alphabet" 
            :key="letter" 
            @click="fetchPostsByLetter(letter)"
            :class="letterClass(letter)"
          >
            {{ letter }}
          </button>
        </div>
        <button class="ml-2" @click="scrollAlphabet('right')" aria-label="Scorri a destra">
          <Icon name="iconamoon:arrow-right-2" class="text-5xl text-celeste hover:text-white hover:bg-verde hover:border hover:rounded-full hover:border-verde" />
        </button>
      </div>
      <div aria-live="polite" class="text-center mt-4">
        <p v-if="!loading && currentPosts.length > 0">
          {{ currentPosts.length }} {{ currentPosts.length === 1 ? 'erba' : 'erbe' }} che inizia{{ currentPosts.length === 1 ? '' : 'no' }} per {{ selectedLetter }}
        </p>
        <p v-else-if="!loading && currentPosts.length === 0">
          Nessun risultato trovato per la lettera {{ selectedLetter }}
        </p>
      </div>
      <div class="w-full mx-auto flex overflow-x-auto mt-10 gap-4 px-4 pb-6 posts-container" style="scroll-padding-right: 30px;">
        <div v-if="loading" class="w-full h-64 flex items-center justify-center">
          <Icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste" />
        </div>
        <div v-else-if="error" class="w-full text-center text-red-500">
          Si è verificato un errore: {{ error }}
        </div>
        <template v-else>
          <div
            v-for="post in currentPosts"
            :key="post.id"
            class="card flex-none w-56 sm:w-64 h-auto p-3 bg-white rounded-2xl shadow transition-all hover:scale-105 hover:shadow-md hover:cursor-pointer"
            @click="goToPost(post.uri)"
          >
            <NuxtImg 
              :src="post.featuredImage?.node?.sourceUrl || '/placeholder-image.jpg'" 
              :alt="post.featuredImage?.node?.altText || post.title" 
              class="w-full h-28 sm:h-32 object-cover rounded-lg" 
              width="240"
              height="128" 
              loading="lazy"
              format="webp"
            />
            <h2 class="mt-4 font-bold text-sm sm:text-base">{{ post.title }}</h2>
            <h3 class="italic text-gray-400 text-xs sm:text-sm">{{ post.nomeScientifico }}</h3>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup async>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAlphabet } from '~/composables/useAlphabet';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';

const router = useRouter();
const { resolveClient } = useApolloClient();
const apolloClient = resolveClient();

// Initialize state and bind methods for navigating and fetching posts by letter
const { 
  alphabet, 
  selectedLetter, 
  alphabetContainer, 
  setSelectedLetter, 
  scrollAlphabet, 
  letterClass 
} = useAlphabet();

const loading = ref(true);
const error = ref(null);
const currentPosts = useState('currentPosts', () => []);

// Cache to store fetched posts by letter
const postsCache = useState('postsCache', () => ({}));

// GraphQL query to fetch posts based on the initial letter of their title
const FETCH_POSTS_BY_LETTER = gql`
  query FetchPostsByLetter($letter: String!) {
    posts(first: 100, where: { search: $letter }) {
      nodes {
        id
        title
        nomeScientifico
        uri
        featuredImage {
          node {
            sourceUrl(size: THUMBNAIL)
            altText
          }
        }
      }
    }
  }
`;

// Function to fetch posts for a given letter, uses Apollo client for GraphQL query execution
async function fetchPostsByLetter(letter) {
  setSelectedLetter(letter);
  
  // Use cache if available to reduce unnecessary network requests
  if (postsCache.value[letter]) {
    currentPosts.value = postsCache.value[letter];
    loading.value = false;
    return;
  }

  // Fetch data from server
  loading.value = true;
  error.value = null;

  try {
    const { data } = await apolloClient.query({
      query: FETCH_POSTS_BY_LETTER,
      variables: { letter }
    });

    // Filter posts that start with the selected letter and update the local state
    if (data && data.posts) {
      const fetchedPosts = data.posts.nodes.filter(post => post.title.charAt(0).toLowerCase() === letter.toLowerCase());
      postsCache.value[letter] = fetchedPosts;
      currentPosts.value = fetchedPosts;
    }
  } catch (err) {
    console.error(`Error fetching posts for letter: ${letter}`, err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// Navigation function to route to the post detail page
function goToPost(uri) {
  console.log(`Navigating to post with URI: ${uri}`);
  router.push(uri);
}

// Fetch initial data server-side
await fetchPostsByLetter('A');
</script>

<style scoped>
.alphabet-section {
  background: rgb(224,237,253);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
}

.alphabet-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.alphabet-container::-webkit-scrollbar {
  display: none;
}

.alphabet-container button {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
}

.alphabet-container button:hover,
.alphabet-container button.active {
  width: 36px;
  height: 36px;
}

.posts-container {
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.posts-container > div {
  scroll-snap-align: start;
}

@media (max-width: 374px) {
  .posts-container {
    padding-right: 20%;
  }
  
  .card {
    width: 85%;
    max-width: 240px;
  }
  
  .card h2 {
    font-size: 0.875rem;
  }
  
  .card h3 {
    font-size: 0.75rem;
  }
}

@media (min-width: 375px) and (max-width: 639px) {
  .posts-container {
    padding-right: 15%;
  }
  
  .card {
    width: 90%;
    max-width: 260px;
  }
}
</style>