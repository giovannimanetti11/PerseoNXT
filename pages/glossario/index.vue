<template>
    <section class="glossario-page-section py-14 w-11/12 m-auto rounded-2xl">
      <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Glossario</h1>
      <Searchfield />
      <div v-if="error">Errore nel caricamento dei dati.</div>
      <div v-if="glossaryTerms.length" class="flex justify-center mt-14">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
          <div v-for="(terms, letter) in groupedTerms" :key="letter" class="mb-6 flex flex-row ml-4 md:ml-0">
            <div class="letter-heading flex text-xl font-bold w-16 h-16 rounded-full bg-celeste text-center"><span class="m-auto content-center text-white">{{ letter }}</span></div>
            <ul class="ml-4 flex flex-row flex-wrap gap-4 self-center">
              <li v-for="term in terms" :key="term.glossaryTermId">
                <nuxt-link :to="`/glossario/${term.slug}`" class="text-black hover:text-blu">
                    <h2>{{ term.title }}</h2>
                </nuxt-link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div v-else class="flex justify-center text-center w-full items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
      </div>
    </section>
    <Contacts />
</template>


  
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import Searchfield from '~/components/searchfield.vue';
import Contacts from "~/components/contacts.vue";

const glossaryTerms = ref([]);
const loading = ref(false);
const error = ref(null);

const FETCH_ALL_GLOSSARY_TERMS = gql`
  query FetchAllPosts {
    glossaryTerms(first: 100) {
      nodes {
        title
        slug
      }
    }
  }
`;

onMounted(() => {
  const { result, loading: queryLoading, error: queryError } = useQuery(FETCH_ALL_GLOSSARY_TERMS);
  
  watch(result, (newResult) => {
    if (newResult && newResult.glossaryTerms) {
      glossaryTerms.value = newResult.glossaryTerms.nodes;
    } else {
      console.error("Errore o struttura dati inattesa:", newResult);
    }
  });

  watch(queryLoading, (newLoading) => {
    loading.value = newLoading;
  });

  watch(queryError, (newError) => {
    if (newError) {
      error.value = newError;
    }
  });
});

const groupedTerms = computed(() => {
  const groups = {};
  glossaryTerms.value.forEach(term => {
    const letter = term.title.charAt(0).toUpperCase();
    if (!groups[letter]) {
      groups[letter] = [];
    }
    groups[letter].push(term);
  });
  const sortedGroups = Object.keys(groups).sort().reduce((acc, letter) => {
    acc[letter] = groups[letter];
    return acc;
  }, {});
  return sortedGroups;
});

</script>




<style scoped>
.glossario-page-section {
    background: rgb(224,237,253);
    background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
}
</style>
  