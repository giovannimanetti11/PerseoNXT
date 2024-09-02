<template>
  <div class="flex justify-center items-center h-screen">
    <div class="w-10/12">
      <button
        class="mt-40 bg-blu text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        @click="updateAlgoliaIndex"
        :disabled="!isClientsReady || isUpdating"
      >
        {{ isUpdating ? 'UPDATING...' : 'UPDATE BLOG POSTS' }}
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
const posts = ref([]);
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

const FETCH_BLOG_POSTS = gql`
  query FetchAllPosts {
    blogPosts(first: 1000) {
      nodes {
        slug
        title
        authorName
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        excerpt
      }
    }
  }
`;

const { result, error, loading } = useQuery(FETCH_BLOG_POSTS);

watchEffect(() => {
  if (loading.value) {
    console.log('Loading blog posts...');
  } else if (error.value) {
    console.error('Apollo query error:', error.value);
  } else if (result.value && result.value.blogPosts) {
    console.log('Blog posts loaded:', result.value.blogPosts.nodes.length);
    posts.value = result.value.blogPosts.nodes.map(post => ({
      objectID: post.slug,
      title: post.title,
      authorName: post.authorName,
      date: post.date,
      imageUrl: post.featuredImage?.node?.sourceUrl || '',
      imageAlt: post.featuredImage?.node?.altText || '',
      contentType: 'blog'
    }));
  }
});

const updateAlgoliaIndex = async () => {
  if (posts.value.length === 0) {
    console.error('No posts to update');
    updateMessage.value = 'No posts to update';
    updateSuccess.value = false;
    return;
  }

  try {
    isUpdating.value = true;
    updateMessage.value = '';
    console.log('Starting Algolia index update...');
    const index = algoliaClient.value.initIndex('wikiherbalist');
    const response = await index.saveObjects(posts.value);
    console.log('Algolia index updated successfully', response.objectIDs);
    updateMessage.value = `Successfully updated ${response.objectIDs.length} blog posts`;
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