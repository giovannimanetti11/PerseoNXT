<template>
  <div class="flex flex-col relative w-11/12 m-auto -my-4">
    <!-- input -->
    <div>
      <div :class="['rounded-2xl w-3/5 m-auto h-14 bg-white flex items-center border border-celeste overflow-hidden', {'rounded-b-none': searchResults.length || (searchMade && !searchResults.length), 'border-b-0': searchResults.length || (searchMade && !searchResults.length)}]">
        <Icon name="heroicons:magnifying-glass-16-solid" class="ml-5 text-celeste text-2xl" />
        <input
          type="search"
          placeholder="Cerca in Wikiherbalist"
          class="w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none"
          v-model="searchTerm"
          @input="handleInput"
        />
        <div v-if="searchTerm" @click="resetSearch" class="ml-2 hover:cursor-pointer">
          <Icon name="ic:baseline-close" class="text-2xl text-celeste mr-4" />
        </div>
      </div>
    </div>
    <!-- results -->
    <div v-if="searchResults.length" class="flex-col w-3/5 m-auto bg-white border border-t-0 border-celeste rounded-b-lg">
      <div v-for="result in searchResults" :key="result.objectID" class="flex items-center py-2 hover:bg-gray-100 hover:rounded-b-lg hover:cursor-pointer" @click="goToPost(result.uri)">
        <NuxtImg :src="result.featuredImage.sourceUrl" alt="result.title" class="rounded-lg w-20 h-20 max-w-[80px] max-h-[80px] object-cover ml-2 mr-4" />
        <div>
          <h3 class="text-lg font-bold">{{ result.title }}</h3>
          <p class="italic">{{ result.nomeScientifico }}</p>
        </div>
      </div>
    </div>
    <div v-else-if="searchMade && !searchResults.length" class="w-3/5 m-auto bg-white border border-celeste rounded-b-lg">
      <div class="flex flex-col p-10 w-auto m-auto">
        <p class="text-red-500 border border-red-500 rounded-lg p-2">Nessun risultato trovato. Prova con parole chiave diverse.</p>
        <p class="text-xs text-gray-600 mt-2">Non trovi la voce che cerchi? Segnalacelo! La inseriremo al più presto</p>
      </div>
    </div>
  </div>
</template>



<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '#components';
import _debounce from 'lodash/debounce';
import algoliasearch from 'algoliasearch/lite';
import { apiConfig } from '~/config.js';

const router = useRouter();
const algoliaClient = algoliasearch(apiConfig.algoliaAppId, apiConfig.algoliaSearchAPIKey);
const searchIndex = algoliaClient.initIndex('posts');

const searchTerm = ref('');
const searchResults = ref([]);
const searchMade = ref(false); 

const debouncedSearch = _debounce(() => {
  if (searchTerm.value.trim().length >= 3) {
    performSearch();
  } else {
    searchResults.value = [];
  }
}, 300);

async function performSearch() {
  searchMade.value = true; 
  try {
    console.log("Performing search for:", searchTerm.value);
    const { hits } = await searchIndex.search(searchTerm.value);
    searchResults.value = hits;
    console.log("Hits received:", hits.length);
  } catch (error) {
    console.error("Error during search:", error);
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
  console.log("Search reset.");
}

function goToPost(uri) {
  router.push(uri);
}
</script>




<style scoped>
</style>
