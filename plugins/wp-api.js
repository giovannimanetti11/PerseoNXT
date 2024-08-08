import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { provideApolloClient } from '@vue/apollo-composable';
import { defineNuxtPlugin } from '#app';
import { apiConfig } from '~/config.js';

export default defineNuxtPlugin((nuxtApp) => {
  const httpLink = createHttpLink({
    uri: apiConfig.baseUrl,
    headers: {
      Authorization: `Basic ${btoa(`${apiConfig.username}:${apiConfig.appPassword}`)}`
    }
  });

  const cache = new InMemoryCache();

  const apolloClient = new ApolloClient({
    link: httpLink,
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });

  nuxtApp.vueApp.provide('apollo', { default: apolloClient });
  provideApolloClient(apolloClient);

  return {
    provide: {
      apolloClient: apolloClient
    }
  };
});