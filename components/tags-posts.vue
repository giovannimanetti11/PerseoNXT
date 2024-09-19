<template>
  <div class="flex flex-col relative w-11/12 m-auto -my-4">
    <div v-if="loading" class="flex justify-center text-center w-full items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
    </div>
    
    <div v-else-if="error" class="text-red-500 text-center mt-4">
      Si è verificato un errore nel caricamento dei dati.
    </div>
    
    <div v-else>
      <!-- Tag count display -->
      <div class="text-center mt-4" v-if="filteredTags.length > 0">
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
        <div v-for="letter in visibleLetters" :key="letter" class="mb-6">
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
</template>

<script setup async>
import { ref, computed, watch, nextTick } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';

const props = defineProps({
  searchTerm: {
    type: String,
    default: ''
  }
});

const { resolveClient } = useApolloClient();
const apolloClient = resolveClient();

const allTags = ref([]);
const loading = ref(true);
const error = ref(null);
const activeTooltip = ref(null);
const tagsContainer = ref(null);
const visibleTagsCount = ref(18);

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

try {
  const { data } = await apolloClient.query({ query: FETCH_ALL_TAGS });
  allTags.value = data.tags.nodes.map(tag => ({
    ...tag,
    posts: tag.posts.nodes
  }));
  loading.value = false;
} catch (err) {
  console.error('Error fetching tags:', err);
  error.value = 'Si è verificato un errore nel caricamento dei dati.';
  loading.value = false;
}

const filteredTags = computed(() => {
  return allTags.value.filter(tag => 
    tag.name.toLowerCase().includes(props.searchTerm.toLowerCase()) &&
    tag.posts.length > 0
  );
});

const visibleTags = computed(() => {
  return filteredTags.value.slice(0, visibleTagsCount.value);
});

const visibleLetters = computed(() => {
  const letters = new Set(visibleTags.value.map(tag => tag.name.charAt(0).toUpperCase()));
  return Array.from(letters).sort();
});

const shouldShowMoreButton = computed(() => {
  return filteredTags.value.length > visibleTagsCount.value;
});

const tooltipStyle = computed(() => ({
  width: '600px', 
  maxWidth: '90vw', 
  top: '50%', 
  left: '50%', 
  transform: 'translate(-50%, -50%)'
}));

const getVisibleTagsByLetter = (letter) => {
  return visibleTags.value.filter(tag => tag.name.charAt(0).toUpperCase() === letter);
};

const loadMoreTags = () => {
  visibleTagsCount.value += 18;
  nextTick(() => {
    updateContainerHeight();
  });
};

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

const updateContainerHeight = () => {
  if (process.client && tagsContainer.value) {
    tagsContainer.value.style.height = 'auto';
  }
};

if (process.client) {
  watch(visibleTags, () => {
    nextTick(() => {
      updateContainerHeight();
    });
  });

  watch(() => props.searchTerm, () => {
    visibleTagsCount.value = 18;
    updateContainerHeight();
  });
}

// Lifecycle hooks
onMounted(() => {
  if (process.client) {
    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);
    document.addEventListener('click', (event) => {
      if (activeTooltip.value !== null && !event.target.closest('.tooltip-custom')) {
        hideTooltip();
      }
    });
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('resize', updateContainerHeight);
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