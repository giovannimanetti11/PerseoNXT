<template>
  <section class="post-section flex flex-row py-10 w-10/12 mx-auto rounded-2xl" v-if="post.data">
    <div class="mt-40 container mx-auto w-2/5 px-4">
      <PostInfo 
        :title="post.data.title"
        :nomeScientifico="post.data.nomeScientifico"
        :publishDate="post.data.date"
        :updateDate="post.data.modified"
        :content="post.data.content"
      />

    </div>
    <div class="w-3/5">
      <div v-if="post.data.featuredImage && post.additionalImagesFiltered.length > 0">
        <Slideshow 
          :featured-image="post.data.featuredImage"
          :additional-images="post.additionalImagesFiltered"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNuxtApp } from '#app';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import Slideshow from '@/components/posts/slideshow.vue';
import PostInfo from '@/components/posts/postinfo.vue';

const route = useRoute();
const { apollo } = useNuxtApp();

const post = reactive({
  data: null,
  additionalImagesFiltered: []
});

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
      post.data = result.value?.postBy;
      if (post.data && post.data.additionalImages) {
        post.additionalImagesFiltered = post.data.additionalImages.filter(img => img && img.url);
      }
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
.post-section {
  background: rgb(245,245,245);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 100%);
}
</style>
