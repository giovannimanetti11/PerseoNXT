import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { provideApolloClient } from '@vue/apollo-composable';
import { defineNuxtPlugin, useRuntimeConfig } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  
  // Helper function for base64 encoding
  const basicAuth = () => {
    if (process.server) {
      // Server-side encoding
      const credentials = `${config.wpUsername}:${config.wpAppPassword}`;
      return `Basic ${Buffer.from(credentials).toString('base64')}`;
    } else {
      // Client-side encoding - these should not be exposed to client
      return '';
    }
  };

  const httpLink = createHttpLink({
    uri: config.wpBaseUrl || 'https://admin.wikiherbalist.com/graphql',
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