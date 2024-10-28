import algoliasearch from 'algoliasearch';
import { defineNuxtPlugin } from '#app';
import { apiConfig } from '~/config';

// Initialize and provide the Algolia client to the Nuxt application.
export default defineNuxtPlugin((nuxtApp) => {
  const algoliaClient = algoliasearch(apiConfig.algoliaAppId, apiConfig.algoliaAdminAPIKey);
  nuxtApp.provide('algoliaClient', algoliaClient);
});
