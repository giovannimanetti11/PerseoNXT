import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { provideApolloClient } from '@vue/apollo-composable';
import { defineNuxtPlugin } from '#app';
import { apiConfig } from '~/config';

export default defineNuxtPlugin(nuxtApp => {
  const httpLink = createHttpLink({
    uri: apiConfig.baseUrl,
    credentials: 'same-origin',
    headers: {
      Authorization: `Basic ${btoa(`${apiConfig.username}:${apiConfig.appPassword}`)}`
    }
  });

  const apolloClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    connectToDevTools: true
  });

  provideApolloClient(apolloClient);

  console.log("Apollo Client:", apolloClient);
});
