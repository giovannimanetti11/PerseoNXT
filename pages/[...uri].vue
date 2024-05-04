<template>
  <section class="post-detail-section py-10 w-11/12 mx-auto rounded-2xl" v-if="post">
    <div class="mt-40 container mx-auto px-4">
      <h1 class="text-5xl">{{ post.title }}</h1>
      <h2 class="text-2xl">{{ post.nomeScientifico }}</h2>
    </div>
  </section>

</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNuxtApp } from '#app';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

const route = useRoute();
const { apollo } = useNuxtApp();

const post = ref(null);

const FETCH_POST_BY_URI = gql`
  query FetchPostByUri($uri: String!) {
    postBy(uri: $uri) {
      title
      nomeScientifico
    }
  }
`;

async function fetchPost() {
  const uri = route.params.uri instanceof Array ? route.params.uri[0] : route.params.uri;

  const { result, loading, error } = useQuery(FETCH_POST_BY_URI, { uri });

  watch(loading, (newLoading) => {
    if (!newLoading && !error.value) {
      post.value = result.value?.postBy;
    }
  });

  watch(error, (newError) => {
    if (newError) {
      console.error('Errore nel caricamento del post:', newError.message);
    }
  });
}

onMounted(fetchPost);
</script>



<style scoped>
.post-detail-section {
  background: rgb(245,245,245);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 100%);
}
</style>
