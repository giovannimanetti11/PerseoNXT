import algoliasearch from 'algoliasearch';
import { defineNuxtPlugin } from '#app';
import { apiConfig } from '~/config';

export default defineNuxtPlugin(nuxtApp => {
  const algoliaClient = algoliasearch(apiConfig.algoliaAppId, apiConfig.algoliaAdminAPIKey);
  nuxtApp.provide('algoliaClient', algoliaClient);
});
