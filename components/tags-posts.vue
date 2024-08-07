<template>
  <section class="tags-posts-section py-14 mt-6 w-11/12 m-auto rounded-2xl" @click="closeTooltipOnOutsideClick">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl md:text-4xl font-bold text-center text-black mb-10">
        <span class="text-blu">Proprietà terapeutiche</span> delle erbe medicinali
      </h2>
      
      <!-- Search input -->
      <div class="flex flex-col relative w-11/12 m-auto -my-4">
        <div class="w-4/5 md:w-3/5 m-auto bg-white overflow-hidden rounded-2xl border-2"
             :class="isFocused ? 'border-blu' : 'border-celeste'">
          <div class="h-12 md:h-14 flex items-center">
            <Icon name="heroicons:magnifying-glass-16-solid" class="ml-5 text-celeste text-2xl" />
            <input
              type="search"
              placeholder="Cerca una proprietà terapeutica"
              class="w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none"
              v-model="searchQuery"
              @input="handleSearch"
              @focus="isFocused = true"
              @blur="isFocused = false"
            />
            <div v-if="searchQuery" @click="resetSearch" class="ml-2 hover:cursor-pointer">
              <Icon name="ic:baseline-close" class="text-2xl text-celeste mr-4" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center items-center h-64">
        <Icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste" />
      </div>
      <div v-else-if="error" class="text-center text-red-500 mt-4">
        Si è verificato un errore: {{ error }}
      </div>
      <div v-else>
        <!-- Alphabet filter -->
        <div v-if="!isSearchActive" class="w-11/12 md:w-9/12 mx-auto flex justify-center mt-8 items-center">
        <button class="mr-2" @click="scrollAlphabet('left')">
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
        <button class="ml-2" @click="scrollAlphabet('right')">
          <Icon name="iconamoon:arrow-right-2" class="text-5xl text-celeste hover:text-white hover:bg-verde hover:border hover:rounded-full hover:border-verde" />
        </button>
      </div>

        <!-- Tag count -->
        <div class="text-center mt-4" v-if="!loading && filteredTags.length > 0">
          <p v-if="filteredTags.length === 1">
            {{ filteredTags.length }} proprietà trovata{{ isSearchActive ? ' per la ricerca "' + searchQuery + '"' : ' che inizia per ' + selectedLetter }}
          </p>
          <p v-else>
            {{ filteredTags.length }} proprietà trovate{{ isSearchActive ? ' per la ricerca "' + searchQuery + '"' : ' che iniziano per ' + selectedLetter }}
          </p>
        </div>

        <!-- No results message -->
        <div v-if="filteredTags.length === 0" class="text-center mt-8 text-gray-600">
          Nessuna proprietà trovata{{ isSearchActive ? ' per la ricerca "' + searchQuery + '"' : ' per la lettera ' + selectedLetter }}
        </div>

        <!-- Tags display -->
        <div class="mt-8" ref="tagsContainer">
          <div v-for="letter in uniqueLetters" :key="letter" class="mb-6">
            <div class="letter-heading flex text-xl font-bold w-16 h-16 rounded-full bg-celeste text-center mb-4">
              <span class="m-auto content-center text-white">{{ letter }}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div v-for="tag in getVisibleTagsByLetter(letter)" :key="tag.id" class="mb-4">
                <h3 class="font-semibold text-lg text-blu mb-2 flex items-center">
                  {{ tag.name }}
                  <div class="relative ml-2">
                    <Icon 
                      name="mdi:information-outline" 
                      class="text-celeste cursor-pointer" 
                      @click.stop="toggleTooltip(tag.id)"
                      @mouseenter="showTooltip(tag.id)"
                    />
                    <div 
                      v-if="activeTooltip === tag.id" 
                      class="tooltip-custom fixed z-50 bg-white border border-blu rounded-lg shadow-lg text-sm text-gray-700"
                      :style="{ 
                        width: '600px', 
                        maxWidth: '90vw', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)'
                      }"
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
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { useAlphabet } from '~/composables/useAlphabet';

const { 
  alphabet, 
  selectedLetter, 
  alphabetContainer, 
  setSelectedLetter, 
  scrollAlphabet, 
  letterClass 
} = useAlphabet();

const searchQuery = ref('');
const tagsToShow = ref(18);
const activeTooltip = ref(null);
const isFocused = ref(false);
const tagsContainer = ref(null);
const loading = ref(true);
const error = ref(null);
const isSearchActive = ref(false);

const FETCH_TAGS_BY_LETTER = gql`
  query FetchTagsByLetter($letter: String!) {
    tags(first: 100, where: { search: $letter }) {
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

const FETCH_ALL_TAGS = gql`
  query FetchAllTags {
    tags(first: 100) {
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

const { result: tagsByLetterResult, loading: tagsByLetterLoading, error: tagsByLetterError, refetch: refetchTagsByLetter } = useQuery(FETCH_TAGS_BY_LETTER, { letter: selectedLetter.value });
const { result: allTagsResult, loading: allTagsLoading, error: allTagsError, refetch: refetchAllTags } = useQuery(FETCH_ALL_TAGS, { enabled: false });

const tagsCache = ref({});

const filteredTags = computed(() => {
  let tags = isSearchActive.value ? allTagsResult.value?.tags.nodes : tagsByLetterResult.value?.tags.nodes;
  if (!tags) return [];
  return tags
    .filter(tag => 
      tag.posts.nodes.length > 0 &&
      (isSearchActive.value
        ? tag.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        : tag.name.charAt(0).toUpperCase() === selectedLetter.value)
    )
    .map(tag => ({
      ...tag,
      posts: tag.posts.nodes
    }));
});

const uniqueLetters = computed(() => {
  const letters = new Set(filteredTags.value.map(tag => tag.name.charAt(0).toUpperCase()));
  return Array.from(letters).sort();
});

const visibleFilteredTags = computed(() => {
  return filteredTags.value.slice(0, tagsToShow.value);
});

const shouldShowMoreButton = computed(() => {
  return filteredTags.value.length > tagsToShow.value;
});

async function fetchTagsByLetter(letter) {
  setSelectedLetter(letter);
  isSearchActive.value = false;
  if (tagsCache.value[letter]) {
    tagsByLetterResult.value = { tags: { nodes: tagsCache.value[letter] } };
    return;
  }
  loading.value = true;
  try {
    const { data } = await refetchTagsByLetter({ letter });
    tagsCache.value[letter] = data.tags.nodes;
    loading.value = false;
  } catch (err) {
    console.error('Error fetching tags:', err);
    error.value = 'Errore nel caricamento dei dati';
    loading.value = false;
  }
}

const getVisibleTagsByLetter = (letter) => {
  return filteredTags.value
    .filter(tag => tag.name.charAt(0).toUpperCase() === letter)
    .slice(0, tagsToShow.value);
};

const loadMoreTags = () => {
  tagsToShow.value += 18;
  nextTick(() => {
    updateContainerHeight();
  });
};

const toggleTooltip = (tagId) => {
  activeTooltip.value = activeTooltip.value === tagId ? null : tagId;
};

const showTooltip = (tagId) => {
  activeTooltip.value = tagId;
};

const hideTooltip = () => {
  activeTooltip.value = null;
};

const closeTooltipOnOutsideClick = (event) => {
  if (activeTooltip.value !== null && !event.target.closest('.tooltip-custom')) {
    hideTooltip();
  }
};

const handleGlobalClick = (event) => {
  if (!event.target.closest('.tags-posts-section')) {
    hideTooltip();
  }
};

const resetSearch = () => {
  searchQuery.value = '';
  isSearchActive.value = false;
  selectedLetter.value = 'A';
  tagsToShow.value = 18;
  fetchTagsByLetter('A');
};

const updateContainerHeight = () => {
  if (tagsContainer.value) {
    tagsContainer.value.style.height = 'auto';
  }
};

const handleSearch = async () => {
  if (searchQuery.value.length >= 3) {
    isSearchActive.value = true;
    loading.value = true;
    try {
      await refetchAllTags();
      loading.value = false;
    } catch (err) {
      console.error('Error fetching all tags:', err);
      error.value = 'Errore nel caricamento dei dati';
      loading.value = false;
    }
  } else if (searchQuery.value.length === 0) {
    resetSearch();
  }
};

const handleEscKey = (event) => {
  if (event.key === 'Escape' && activeTooltip.value !== null) {
    hideTooltip();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleEscKey);
  document.addEventListener('click', handleGlobalClick);
  updateContainerHeight();
  window.addEventListener('resize', updateContainerHeight);
  fetchTagsByLetter('A');
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey);
  document.removeEventListener('click', handleGlobalClick);
  window.removeEventListener('resize', updateContainerHeight);
});

watch([searchQuery, selectedLetter], () => {
  tagsToShow.value = 18;
  nextTick(() => {
    updateContainerHeight();
  });
});

watch(visibleFilteredTags, () => {
  nextTick(() => {
    updateContainerHeight();
  });
});

watch(tagsByLetterLoading, (newLoading) => {
  loading.value = newLoading;
});

watch(allTagsLoading, (newLoading) => {
  loading.value = newLoading;
});

watch(tagsByLetterError, (newError) => {
  if (newError) {
    console.error('GraphQL error:', newError);
    error.value = 'Si è verificato un errore durante il caricamento dei dati.';
  }
});

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