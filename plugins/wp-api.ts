import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { provideApolloClient } from '@vue/apollo-composable';
import { defineNuxtPlugin } from '#app';
import { apiConfig } from '@config';

export default defineNuxtPlugin((nuxtApp) => {
  // Helper function for base64 encoding
  const basicAuth = () => {
    if (process.server) {
      // Server-side encoding
      const credentials = `${apiConfig.username}:${apiConfig.appPassword}`;
      return `Basic ${Buffer.from(credentials).toString('base64')}`;
    } else {
      // Client-side encoding
      return `Basic ${btoa(`${apiConfig.username}:${apiConfig.appPassword}`)}`;
    }
  };

  const httpLink = createHttpLink({
    uri: apiConfig.baseUrl,
    headers: {
      Authorization: basicAuth()
    }
  });

  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            merge(existing, incoming) {
              return incoming;
            }
          },
          glossaryTerms: {
            merge(existing, incoming) {
              return incoming;
            }
          }
        }
      }
    }
  });

  const apolloClient = new ApolloClient({
    ssrMode: process.server,
    link: httpLink,
    cache: cache,
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