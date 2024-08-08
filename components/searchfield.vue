<template>
  <div class="flex flex-col relative w-11/12 m-auto -my-4">
    <div 
      :class="[
        'w-4/5 md:w-3/5 m-auto bg-white overflow-hidden rounded-2xl border-2',
        isFocused || searchResults.length || (searchMade && !searchResults.length)
          ? 'border-blu'
          : 'border-celeste'
      ]"
    >
      <div 
        :class="[
          'h-12 md:h-14 flex items-center',
          {'rounded-b-none': searchResults.length || (searchMade && !searchResults.length)}
        ]"
      >
        <Icon name="heroicons:magnifying-glass-16-solid" class="ml-5 text-celeste text-2xl" />
        <input
          type="search"
          placeholder="Cerca in Wikiherbalist"
          class="w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none"
          v-model="searchTerm"
          @input="handleInput"
          @focus="isFocused = true"
          @blur="isFocused = false"
        />
        <div v-if="searchTerm" @click="resetSearch" class="ml-2 hover:cursor-pointer">
          <Icon name="ic:baseline-close" class="text-2xl text-celeste mr-4" />
        </div>
      </div>
      
      <div v-if="searchResults.length" class="border-t border-celeste">
        <div v-for="result in searchResults" :key="result.objectID" class="flex items-center py-2 hover:bg-gray-100 hover:cursor-pointer" @click="goToPost(result.uri || result.slug)">
          <NuxtImg :src="result.featuredImage ? result.featuredImage.sourceUrl : result.imageUrl" :alt="result.title" class="rounded-lg w-20 h-20 max-w-[80px] max-h-[80px] object-cover ml-2 mr-4" />
          <div>
            <h3 class="text-lg font-bold">{{ result.title }}</h3>
            <p class="italic">{{ result.nomeScientifico || '' }}</p>
          </div>
        </div>
      </div>
      <div v-else-if="searchMade && !searchResults.length">
        <div class="flex flex-col p-10 w-auto m-auto">
          <p class="text-red-500 border border-red-500 rounded-lg p-2">Nessun risultato trovato. Prova con parole chiave diverse.</p>
          <p class="text-xs text-gray-600 mt-2">Non trovi la voce che cerchi? Segnalacelo! La inseriremo al più presto</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '#components';
import { useDebounceFn } from '@vueuse/core';
import algoliasearch from 'algoliasearch/lite';
import { apiConfig } from '~/config.js';

const isFocused = ref(false);

const router = useRouter();
const algoliaClient = algoliasearch(apiConfig.algoliaAppId, apiConfig.algoliaSearchAPIKey);
const postsIndex = algoliaClient.initIndex('posts');
const glossaryIndex = algoliaClient.initIndex('glossary');

const searchTerm = ref('');
const searchResults = ref([]);
const searchMade = ref(false); 

const debouncedSearch = useDebounceFn(async () => {
  if (searchTerm.value.trim().length >= 3) {
    await performSearch();
  } else {
    searchResults.value = [];
  }
}, 300);

async function performSearch() {
  searchMade.value = true;
  try {
    const postSearchPromise = postsIndex.search(searchTerm.value);
    const glossarySearchPromise = glossaryIndex.search(searchTerm.value);

    const [postResults, glossaryResults] = await Promise.all([postSearchPromise, glossarySearchPromise]);

    searchResults.value = [...postResults.hits, ...glossaryResults.hits];
  } catch (error) {
    searchResults.value = [];
  }
}

function handleInput() {
  if (!searchTerm.value.trim()) {
    resetSearch();
    return;
  }
  debouncedSearch();
}

function resetSearch() {
  searchTerm.value = '';
  searchResults.value = [];
  searchMade.value = false;
}

function goToPost(uri) {
  router.push(uri);
}
</script>