<template>
  <div class="flex justify-center items-center h-screen">
    <div class="w-10/12">
      <button
        class="mt-40 bg-blu text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        @click="updateAlgoliaIndex"
        :disabled="!isClientsReady || isUpdating"
      >
        {{ isUpdating ? 'UPDATING...' : 'UPDATE GLOSSARY TERMS' }}
      </button>
      <p v-if="updateMessage" class="mt-4 text-center" :class="{ 'text-green-500': updateSuccess, 'text-red-500': !updateSuccess }">
        {{ updateMessage }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watchEffect } from 'vue';
import { useNuxtApp } from '#app';
import gql from 'graphql-tag';
import { useQuery } from '@vue/apollo-composable';

const algoliaClient = ref(null);
const apolloClient = ref(null);
const terms = ref([]);
const isClientsReady = ref(false);
const isUpdating = ref(false);
const updateMessage = ref('');
const updateSuccess = ref(false);

onMounted(() => {
  const nuxtApp = useNuxtApp();
  algoliaClient.value = nuxtApp.$algoliaClient;
  apolloClient.value = nuxtApp.$apolloClient;
  if (algoliaClient.value && apolloClient.value) {
    isClientsReady.value = true;
    console.log('Clients initialized successfully');
  } else {
    console.error('Clients are not initialized properly');
  }
});

const FETCH_ALL_GLOSSARY_TERMS = gql`
  query FetchAllTerms {
    glossaryTerms(first: 1000) {
      nodes {
        slug
        title
        authorName
        plurale
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

const { result, error, loading } = useQuery(FETCH_ALL_GLOSSARY_TERMS);

watchEffect(() => {
  if (loading.value) {
    console.log('Loading glossary terms...');
  } else if (error.value) {
    console.error('Apollo query error:', error.value);
  } else if (result.value && result.value.glossaryTerms) {
    console.log('Glossary terms loaded:', result.value.glossaryTerms.nodes.length);
    terms.value = result.value.glossaryTerms.nodes.map(term => ({
      objectID: term.slug,
      title: term.title,
      imageUrl: term.featuredImage?.node?.sourceUrl || '',
      imageAlt: term.featuredImage?.node?.altText || '',
      contentType: 'glossary'
    }));
  }
});

const updateAlgoliaIndex = async () => {
  if (terms.value.length === 0) {
    console.error('No terms to update');
    updateMessage.value = 'No terms to update';
    updateSuccess.value = false;
    return;
  }

  try {
    isUpdating.value = true;
    updateMessage.value = '';
    console.log('Starting Algolia index update...');
    const index = algoliaClient.value.initIndex('wikiherbalist');
    const response = await index.saveObjects(terms.value);
    console.log('Algolia index updated successfully', response.objectIDs);
    updateMessage.value = `Successfully updated ${response.objectIDs.length} glossary terms`;
    updateSuccess.value = true;
  } catch (error) {
    console.error('Error updating Algolia index:', error);
    updateMessage.value = `Error updating Algolia index: ${error.message}`;
    updateSuccess.value = false;
  } finally {
    isUpdating.value = false;
  }
};
</script>