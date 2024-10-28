import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { provideApolloClient } from '@vue/apollo-composable';
import { defineNuxtPlugin } from '#app';
import { apiConfig } from '@config';

// Defines a Nuxt plugin to setup Apollo Client with a configured HTTP link and cache policies.
export default defineNuxtPlugin((nuxtApp) => {
  const httpLink = createHttpLink({
    uri: apiConfig.baseUrl,
    headers: {
      Authorization: `Basic ${btoa(`${apiConfig.username}:${apiConfig.appPassword}`)}`
    }
  });

  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            merge(existing: any, incoming: any): any {
              return incoming;
            }
          },
          glossaryTerms: {
            merge(existing: any, incoming: any): any {
              return incoming;
            }
          }
        }
      }
    }
  });

  const apolloClient = new ApolloClient({
    ssrMode: true, // Enable SSR mode
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
