<template>
  <section class="post-detail-section py-10 w-11/12 mx-auto rounded-2xl" v-if="post">
    <div class="mt-40 container mx-auto px-4">
      <h1 class="text-5xl">{{ post.title }}</h1>
      <h2 class="text-2xl">{{ post.nomeScientifico }}</h2>
      <div v-html="post.excerpt"></div>
      <p><span class="font-bold">Parti usate:</span> {{ post.partiUsate }}</p>
      <p><span class="font-bold">Nome comune:</span> {{ post.nomeComune }}</p>
      <p><span class="font-bold">Tossica:</span> {{ post.tossica ? 'Sì' : 'No' }}</p>
      <p><span class="font-bold">Costituenti principali:</span> {{ post.costituenti }}</p>
      <p><span class="font-bold">Autore:</span> {{ post.authorName }}</p>
      <p><span class="font-bold">Data di pubblicazione:</span> {{ new Date(post.date).toLocaleDateString() }}</p>
      <p><span class="font-bold">Ultima modifica:</span> {{ new Date(post.modified).toLocaleDateString() }}</p>
      <div v-html="post.content"></div>
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
      id
      title
      nomeScientifico
      partiUsate
      nomeComune
      tossica
      excerpt
      costituenti
      authorName
      date
      modified
      content
      featuredImage {
        node {
          altText
          caption
          sourceUrl
        }
      }
      additionalImages {
        altText
        caption
        url
      }
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
