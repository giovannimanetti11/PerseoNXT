<template>
  <div class="flex flex-col relative w-11/12 m-auto -my-4">
    <div v-if="loading" class="flex justify-center text-center w-full items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
    </div>
    
    <div v-else-if="error" class="text-red-500 text-center mt-4">
      Si è verificato un errore nel caricamento dei dati.
    </div>
    
    <div v-else>
      <!-- Alphabet navigation -->
      <div class="w-full mx-auto flex justify-center mt-8 items-center">
        <button class="mr-2" @click="scrollAlphabet('left')" aria-label="Scorri a sinistra">
          <Icon name="iconamoon:arrow-left-2" class="text-5xl text-celeste hover:text-white hover:bg-verde hover:rounded-full hover:border-verde" />
        </button>
        <div class="flex overflow-hidden alphabet-container" ref="alphabetContainer">
          <button 
            v-for="letter in alphabet" 
            :key="letter" 
            @click="fetchTagsByLetter(letter)"
            :class="letterClass(letter)"
          >
            {{ letter }}
          </button>
        </div>
        <button class="ml-2" @click="scrollAlphabet('right')" aria-label="Scorri a destra">
          <Icon name="iconamoon:arrow-right-2" class="text-5xl text-celeste hover:text-white hover:bg-verde hover:border hover:rounded-full hover:border-verde" />
        </button>
      </div>

      <!-- Tag count display -->
      <div class="text-center mt-4">
        <p v-if="filteredTags.length === 1">
          {{ filteredTags.length }} proprietà trovata per la lettera {{ selectedLetter }}{{ searchTerm ? ' e la ricerca "' + searchTerm + '"' : '' }}
        </p>
        <p v-else-if="filteredTags.length > 1">
          {{ filteredTags.length }} proprietà trovate per la lettera {{ selectedLetter }}{{ searchTerm ? ' e la ricerca "' + searchTerm + '"' : '' }}
        </p>
        <p v-else>
          Nessuna proprietà trovata per la lettera {{ selectedLetter }}{{ searchTerm ? ' e la ricerca "' + searchTerm + '"' : '' }}
        </p>
      </div>

      <!-- Tags display -->
      <div class="mt-8" ref="tagsContainer">
        <div v-if="filteredTags.length > 0" class="mb-6">
          <!-- Letter heading -->
          <div class="letter-heading flex text-xl font-bold w-16 h-16 rounded-full bg-celeste text-center mb-4">
            <span class="m-auto content-center text-white">{{ selectedLetter }}</span>
          </div>
          <!-- Tags grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div v-for="tag in visibleTags" :key="tag.id" class="mb-4">
              <h3 class="font-semibold text-lg text-blu mb-2 flex items-center">
                {{ tag.name }}
                <!-- Info icon and tooltip -->
                <div class="relative ml-2">
                  <Icon 
                    name="mdi:information-outline" 
                    class="text-celeste cursor-pointer" 
                    @click.stop="toggleTooltip(tag.id)"
                    @mouseenter="showTooltip(tag.id)"
                  />
                  <div 
                    v-if="activeTooltip === tag.id" 
                    class="tooltip-custom fixed z-50 bg-white rounded-lg shadow-lg text-sm text-gray-700"
                    :style="tooltipStyle"
                    @click.stop
                  >
                    <div class="p-6">
                      <h4 class="text-2xl font-bold text-blu mb-4">{{ tag.name }}</h4>
                      <button @click.stop="hideTooltip" class="absolute top-2 right-2 text-blu hover:text-celeste">
                        <Icon name="mdi:close" class="text-xl" />
                      </button>
                      <p v-html="tag.description" class="font-normal"></p>
                    </div>
                  </div>
                </div>
              </h3>
              <!-- Associated posts -->
              <p class="text-sm">
                <template v-for="(post, index) in tag.posts" :key="post.id">
                  <NuxtLink :to="post.uri" class="text-black hover:text-blu">{{ post.title }}</NuxtLink><span v-if="index < tag.posts.length - 1">, </span>
                </template>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Load more button -->
      <div class="text-center mt-8" v-if="hasMoreTags">
        <button @click="loadMoreTags" class="bg-transparent text-blu py-2 px-4 border border-blu rounded-xl hover:text-verde hover:border-verde">
          Mostra più proprietà
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import { useAlphabet } from '~/composables/useAlphabet';
import gql from 'graphql-tag';

const props = defineProps({
  searchTerm: {
    type: String,
    default: ''
  }
});

const { resolveClient } = useApolloClient();
const apolloClient = resolveClient();

const { 
  alphabet, 
  selectedLetter, 
  alphabetContainer, 
  setSelectedLetter, 
  scrollAlphabet, 
  letterClass 
} = useAlphabet();

const allTags = ref([]);
const visibleTags = ref([]);
const loading = ref(true);
const error = ref(null);
const activeTooltip = ref(null);
const tagsContainer = ref(null);
const pageSize = 18;
const currentPage = ref(1);

const FETCH_TAGS_BY_LETTER = gql`
  query FetchTagsByLetter($letter: String!) {
    tags(first: 1000, where: { search: $letter }) {
      nodes {
        id
        name
        description
        posts {
          nodes {
            id
            title
            uri
          }
        }
      }
    }
  }
`;

const fetchTagsByLetter = async (letter) => {
  loading.value = true;
  error.value = null;
  setSelectedLetter(letter);
  currentPage.value = 1;

  try {
    const { data } = await apolloClient.query({
      query: FETCH_TAGS_BY_LETTER,
      variables: { letter }
    });

    allTags.value = data.tags.nodes.filter(tag => tag.name.charAt(0).toLowerCase() === letter.toLowerCase());
    updateVisibleTags();
  } catch (err) {
    console.error('Error fetching tags:', err);
    error.value = 'Si è verificato un errore nel caricamento dei dati.';
  } finally {
    loading.value = false;
  }
};

const updateVisibleTags = () => {
  const startIndex = 0;
  const endIndex = currentPage.value * pageSize;
  visibleTags.value = filteredTags.value.slice(startIndex, endIndex);
};

const loadMoreTags = () => {
  currentPage.value++;
  updateVisibleTags();
};

const hasMoreTags = computed(() => {
  return visibleTags.value.length < filteredTags.value.length;
});

const filteredTags = computed(() => {
  return allTags.value.filter(tag => 
    tag.name.toLowerCase().includes(props.searchTerm.toLowerCase()) &&
    tag.posts.nodes.length > 0
  );
});

const tooltipStyle = computed(() => ({
  width: '600px', 
  maxWidth: '90vw', 
  top: '50%', 
  left: '50%', 
  transform: 'translate(-50%, -50%)'
}));

const toggleTooltip = (tagId) => {
  if (activeTooltip.value === tagId) {
    hideTooltip();
  } else {
    showTooltip(tagId);
  }
};

const showTooltip = (tagId) => {
  activeTooltip.value = tagId;
};

const hideTooltip = () => {
  activeTooltip.value = null;
};

watch(() => props.searchTerm, () => {
  currentPage.value = 1;
  updateVisibleTags();
});

onMounted(() => {
  fetchTagsByLetter('A');
});

onMounted(() => {
  if (process.client) {
    document.addEventListener('click', (event) => {
      if (activeTooltip.value !== null && !event.target.closest('.tooltip-custom')) {
        hideTooltip();
      }
    });
  }
});

onUnmounted(() => {
  if (process.client) {
    document.removeEventListener('click', hideTooltip);
  }
});
</script>

<style scoped>
.tags-posts-section {
  background: rgb(224,237,253);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
}

.tooltip-custom {
  max-height: 90vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .tooltip-custom {
    width: 90vw !important;
  }
}

.alphabet-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.alphabet-container::-webkit-scrollbar {
  display: none;
}

.alphabet-container button {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
}

.alphabet-container button:hover,
.alphabet-container button.active {
  width: 40px;
  height: 40px;
}
</style>