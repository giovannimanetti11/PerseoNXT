<template>
  <div class="flex justify-center items-center h-screen">
    <div class="w-10/12">
      <button
        class="mt-40 bg-blu text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        @click="updateAlgoliaIndex"
        :disabled="!isClientsReady"
      >
        UPDATE
      </button>
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
const posts = ref([]);
const isClientsReady = ref(false);

onMounted(() => {
const nuxtApp = useNuxtApp();
algoliaClient.value = nuxtApp.$algoliaClient;
apolloClient.value = nuxtApp.$apolloClient;
if (algoliaClient.value && apolloClient.value) {
  isClientsReady.value = true;
} else {
  console.error('Clients are not initialized properly');
}
});

// Define GraphQL query for fetching posts
const FETCH_POSTS = gql`
query FetchPosts {
  posts(first: 100) {
    nodes {
      id
      title
      nomeScientifico
      uri
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

// Reactive Apollo query
const { result, loading, error } = useQuery(FETCH_POSTS, {}, { client: apolloClient });

// Watch the result and update the posts ref when the data is available
watchEffect(() => {
if (result.value && result.value.posts) {
  console.log('Query result:', result.value.posts.nodes);
  posts.value = result.value.posts.nodes.map(post => ({
    objectID: post.id,
    title: post.title,
    nomeScientifico: post.nomeScientifico,
    uri: post.uri,
    imageUrl: post.featuredImage.node.sourceUrl,
    imageAlt: post.featuredImage.node.altText,
  }));
}
if (error.value) {
  console.error('Apollo query error:', error.value);
}
});

const updateAlgoliaIndex = async () => {
if (posts.value.length === 0) {
  console.error('No posts to update');
  return;
}

try {
  const response = await algoliaClient.value.initIndex('posts').partialUpdateObjects(posts.value, { createIfNotExists: true });
  console.log('Algolia index updated successfully', response.objectIDs);
} catch (error) {
  console.error('Error updating Algolia index:', error.message);
}
};
</script>
