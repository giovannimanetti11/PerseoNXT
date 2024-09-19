<template>
  <section class="glossario-page-section py-14 w-11/12 m-auto rounded-2xl">
    <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Glossario</h1>
    <Searchfield />
    <div v-if="loading" class="flex justify-center text-center w-full items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
    </div>
    <div v-else-if="error" class="text-red-500 text-center">
      Si è verificato un errore nel caricamento dei dati. Riprova più tardi.
    </div>
    <div v-else-if="glossaryTerms.length" class="flex justify-center mt-14">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <div v-for="(terms, letter) in groupedTerms" :key="letter" class="mb-6 flex flex-row ml-4 md:ml-0">
          <div class="letter-heading flex text-xl font-bold w-16 h-16 rounded-full bg-celeste text-center"><span class="m-auto content-center text-white">{{ letter }}</span></div>
          <ul class="ml-4 flex flex-row flex-wrap gap-4 self-center">
            <li v-for="term in terms" :key="term.slug">
              <nuxt-link :to="`/glossario/${term.slug}`" class="text-black hover:text-blu">
                  <h2>{{ term.title }}</h2>
              </nuxt-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-else class="text-center mt-8">
      Nessun termine trovato nel glossario.
    </div>
  </section>
  <Contacts />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import Searchfield from '~/components/searchfield.vue';
import Contacts from "~/components/contacts.vue";

const glossaryTerms = ref([]);
const loading = ref(true);
const error = ref(null);

const FETCH_ALL_GLOSSARY_TERMS = gql`
  query FetchAllGlossaryTerms {
    glossaryTerms(first: 1000) {
      nodes {
        title
        slug
      }
    }
  }
`;

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
    console.error('GraphQL query error:', newError);
    error.value = 'Si è verificato un errore durante il caricamento dei dati.';
  }
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
  return Object.fromEntries(
    Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  );
});

useHead({
  title: 'Glossario'
})
</script>

<style scoped>
.glossario-page-section {
    background: rgb(224,237,253);
    background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
}
</style>