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
            class="w-12 h-12 flex justify-center items-center rounded-full flex-shrink-0"
          >
            {{ letter }}
          </button>
        </div>

        <button class="ml-2" @click="scrollAlphabet('right')" aria-label="Scorri a destra">
          <Icon name="iconamoon:arrow-right-2" class="text-5xl text-celeste hover:text-white hover:bg-verde hover:border hover:rounded-full hover:border-verde" />
        </button>
      </div>

      <div aria-live="polite" class="text-center mt-4">
        <p v-if="!isLoading && sortedPosts.length > 0">
          {{ sortedPosts.length }} {{ sortedPosts.length === 1 ? 'erba' : 'erbe' }} che inizia{{ sortedPosts.length === 1 ? '' : 'no' }} per {{ selectedLetter }}
        </p>
        <p v-else-if="!isLoading && sortedPosts.length === 0">
          Nessun risultato trovato per la lettera {{ selectedLetter }}
        </p>
      </div>

      <div v-if="isLoading" class="w-full h-64 flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
      </div>

      <div v-else class="w-full mx-auto flex overflow-x-auto mt-10 gap-4 px-4 pb-6 posts-container" style="scroll-padding-right: 30px;">
        <div
          v-for="post in sortedPosts"
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
            format="webp"
            quality="90"
          />
          <h2 class="mt-4 font-bold text-sm sm:text-base">{{ post.title }}</h2>
          <h3 class="italic text-gray-400 text-xs sm:text-sm">{{ post.nomeScientifico }}</h3>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAlphabet } from '~/composables/useAlphabet';
import { useGraphQL } from '~/composables/useGraphQL';

const router = useRouter();
const { query } = useGraphQL();

const { 
  alphabet, 
  selectedLetter, 
  alphabetContainer, 
  setSelectedLetter, 
  scrollAlphabet, 
  letterClass 
} = useAlphabet();

const emit = defineEmits(['update:loading']);

const FETCH_POSTS_BY_LETTER = `
  query FetchPostsByLetter($letter: String!) {
    posts(first: 1000, where: { search: $letter }) {
      nodes {
        id
        title
        nomeScientifico
        uri
        featuredImage {
          node {
            sourceUrl(size: MEDIUM)
            altText
          }
        }
      }
    }
  }
`;

// Fetch initial data with SSR - Googlebot sees plants starting with 'A'
const { data: initialPosts, pending: isLoading } = await useAsyncData(
  'plants-by-letter-A',
  async () => {
    try {
      const data = await query(FETCH_POSTS_BY_LETTER, { letter: 'A' });
      setSelectedLetter('A');
      return data.posts.nodes;
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  },
  {
    server: true,  // Force SSR - Googlebot sees content
    lazy: false
  }
);

const currentPosts = ref(initialPosts.value || []);

const sortedPosts = computed(() => {
  if (!currentPosts.value) return [];

  return [...currentPosts.value]
    .filter(post => post.title.charAt(0).toLowerCase() === selectedLetter.value.toLowerCase())
    .sort((a, b) => a.title.localeCompare(b.title, 'it', { sensitivity: 'base' }));
});

const fetchPostsByLetter = async (letter) => {
  setSelectedLetter(letter);
  emit('update:loading', true);

  try {
    const data = await query(FETCH_POSTS_BY_LETTER, { letter });
    currentPosts.value = data.posts.nodes;
  } catch (error) {
    console.error('Error fetching posts:', error);
    currentPosts.value = [];
  } finally {
    emit('update:loading', false);
  }
};

const goToPost = (uri) => {
  router.push(uri);
};
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
  display: flex;
  justify-content: center;
  align-items: center;
}

.alphabet-container button:hover,
.alphabet-container button.active {
  /* Styles for hover and active states remain, but dimensions are handled by Tailwind */
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