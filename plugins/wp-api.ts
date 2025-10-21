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
            keyArgs: ['first', 'where'],
            merge(existing, incoming, { args }) {
              // Don't cache search queries (they change frequently)
              if (args?.where?.search) {
                return incoming;
              }
              return incoming;
            }
          },
          glossaryTerms: {
            keyArgs: ['first', 'where'],
            merge(existing, incoming) {
              return incoming;
            }
          },
          blogPosts: {
            merge(existing, incoming) {
              // Merge array-based results
              if (Array.isArray(existing) && Array.isArray(incoming)) {
                return [...incoming];
              }
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
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
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