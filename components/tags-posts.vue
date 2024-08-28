<template>
  <section class="tags-posts-section py-2 w-11/12 m-auto rounded-2xl">
    <div class="container mx-auto px-0 md:px-4 mt-4">
      <!-- Alphabet filter -->
      <div class="w-full mx-auto flex justify-center mt-8 items-center">
        <button class="mr-2" @click="scrollAlphabet('left')" aria-label="Scroll left">
          <Icon name="iconamoon:arrow-left-2" class="text-5xl text-celeste hover:text-white hover:bg-verde hover:rounded-full hover:border-verde" />
        </button>
        <div class="flex overflow-hidden alphabet-container" ref="alphabetContainer">
          <button 
            v-for="letter in alphabet" 
            :key="letter"
            @click="fetchTagsByLetter(letter)"
            :class="['px-4 py-2 rounded-full mx-1 whitespace-nowrap', 
              selectedLetter === letter ? 'bg-celeste text-white' : 'text-black font-bold hover:bg-celeste hover:text-white']"
          >
            {{ letter }}
          </button>
        </div>
        <button class="ml-2" @click="scrollAlphabet('right')" aria-label="Scroll right">
          <Icon name="iconamoon:arrow-right-2" class="text-5xl text-celeste hover:text-white hover:bg-verde hover:border hover:rounded-full hover:border-verde" />
        </button>
      </div>

      <!-- Loading indicator -->
      <div v-if="loading" class="flex justify-center text-center w-full items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
      </div>

      <!-- Error message -->
      <div v-else-if="error" class="text-center text-red-500 mt-4">
        Si è verificato un errore: {{ error }}
      </div>

      <div v-else>
        <!-- Tag count display -->
        <div class="text-center mt-4" v-if="!loading && filteredTags.length > 0">
          <p v-if="filteredTags.length === 1">
            {{ filteredTags.length }} proprietà trovata{{ searchTerm ? ' per la ricerca "' + searchTerm + '"' : '' }}
          </p>
          <p v-else>
            {{ filteredTags.length }} proprietà trovate{{ searchTerm ? ' per la ricerca "' + searchTerm + '"' : '' }}
          </p>
        </div>

        <!-- No results message -->
        <div v-if="filteredTags.length === 0" class="text-center mt-8 text-gray-600">
          Nessuna proprietà trovata{{ searchTerm ? ' per la ricerca "' + searchTerm + '"' : '' }}
        </div>

        <!-- Tags display -->
        <div class="mt-8" ref="tagsContainer">
          <div v-for="letter in uniqueLetters" :key="letter" class="mb-6">
            <!-- Letter heading -->
            <div class="letter-heading flex text-xl font-bold w-16 h-16 rounded-full bg-celeste text-center mb-4">
              <span class="m-auto content-center text-white">{{ letter }}</span>
            </div>
            <!-- Tags grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div v-for="tag in getVisibleTagsByLetter(letter)" :key="tag.id" class="mb-4">
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
        <div class="text-center mt-8" v-if="shouldShowMoreButton">
          <button @click="loadMoreTags" class="bg-transparent text-blu py-2 px-4 border border-blu rounded-xl hover:text-verde hover:border-verde">
            Mostra più proprietà
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

// Props definition
const props = defineProps({
  searchTerm: {
    type: String,
    default: ''
  }
});

// Constants and reactive references
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const selectedLetter = ref('A');
const tagsToShow = ref(18);
const activeTooltip = ref(null);
const alphabetContainer = ref(null);
const tagsContainer = ref(null);
const loading = ref(true);
const error = ref(null);

// GraphQL query to fetch all tags
const FETCH_ALL_TAGS = gql`
  query FetchAllTags {
    tags(first: 1000) {
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

// Execute the GraphQL query
const { result: allTagsResult, loading: allTagsLoading, error: allTagsError } = useQuery(FETCH_ALL_TAGS);

// Computed property to get all tags from the query result
const allTags = computed(() => allTagsResult.value?.tags.nodes || []);

// Filter tags based on the search term and selected letter
const filteredTags = computed(() => {
  return allTags.value.filter(tag => 
    tag.name.toLowerCase().includes(props.searchTerm.toLowerCase()) &&
    (props.searchTerm || tag.name.charAt(0).toUpperCase() === selectedLetter.value) &&
    tag.posts.nodes.length > 0
  ).map(tag => ({
    ...tag,
    posts: tag.posts.nodes
  }));
});

// Get unique first letters of filtered tags
const uniqueLetters = computed(() => {
  const letters = new Set(filteredTags.value.map(tag => tag.name.charAt(0).toUpperCase()));
  return Array.from(letters).sort();
});

// Get visible tags based on the current tagsToShow value
const visibleFilteredTags = computed(() => {
  return filteredTags.value.slice(0, tagsToShow.value);
});

// Determine if the "Show more" button should be displayed
const shouldShowMoreButton = computed(() => {
  return filteredTags.value.length > tagsToShow.value;
});

// Tooltip style
const tooltipStyle = computed(() => ({
  width: '600px', 
  maxWidth: '90vw', 
  top: '50%', 
  left: '50%', 
  transform: 'translate(-50%, -50%)'
}));

// Get visible tags for a specific letter
const getVisibleTagsByLetter = (letter) => {
  return filteredTags.value
    .filter(tag => tag.name.charAt(0).toUpperCase() === letter)
    .slice(0, tagsToShow.value);
};

// Fetch tags for a specific letter
const fetchTagsByLetter = (letter) => {
  selectedLetter.value = letter;
  tagsToShow.value = 18;
  updateContainerHeight();
};

// Load more tags
const loadMoreTags = () => {
  tagsToShow.value += 18;
  nextTick(() => {
    updateContainerHeight();
  });
};

// Toggle tooltip visibility
const toggleTooltip = (tagId) => {
  if (activeTooltip.value === tagId) {
    hideTooltip();
  } else {
    showTooltip(tagId);
  }
};

// Show tooltip
const showTooltip = (tagId) => {
  activeTooltip.value = tagId;
};

// Hide tooltip
const hideTooltip = () => {
  activeTooltip.value = null;
};

// Close tooltip when clicking outside
const closeTooltipOnOutsideClick = (event) => {
  if (activeTooltip.value !== null && !event.target.closest('.tooltip-custom')) {
    hideTooltip();
  }
};

// Scroll alphabet
const scrollAlphabet = (direction) => {
  if (alphabetContainer.value) {
    alphabetContainer.value.scrollLeft += direction === 'left' ? -100 : 100;
  }
};

// Update the height of the tags container
const updateContainerHeight = () => {
  if (tagsContainer.value) {
    tagsContainer.value.style.height = 'auto';
  }
};

// Lifecycle hooks
onMounted(() => {
  updateContainerHeight();
  window.addEventListener('resize', updateContainerHeight);
  // Add event listener to close tooltip when clicking outside
  document.addEventListener('click', closeTooltipOnOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight);
  // Remove event listener when component is unmounted
  document.removeEventListener('click', closeTooltipOnOutsideClick);
});

// Watch for changes in search term
watch(() => props.searchTerm, () => {
  if (props.searchTerm) {
    selectedLetter.value = '';
  } else {
    selectedLetter.value = 'A';
  }
  tagsToShow.value = 18;
  updateContainerHeight();
});

// Watch for changes in filtered tags and update container height
watch(visibleFilteredTags, () => {
  nextTick(() => {
    updateContainerHeight();
  });
});

// Watch for loading state changes
watch(allTagsLoading, (newLoading) => {
  loading.value = newLoading;
});

// Watch for error state changes
watch(allTagsError, (newError) => {
  if (newError) {
    console.error('GraphQL error:', newError);
    error.value = 'Si è verificato un errore durante il caricamento dei dati.';
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