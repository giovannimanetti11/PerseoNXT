<template>
  <section class="py-10 w-11/12 mx-auto rounded-2xl alphabet-section">
    <div class="container mx-auto px-4 mt-4">
      <h3 class="text-4xl font-bold text-center text-black">Sfoglia le <span class="text-blu">monografie</span>, lettera per lettera</h3>
      <div class="w-9/12 mx-auto flex justify-center mt-8 items-center">
        <!-- left arrow -->
        <button class="mr-2" @click="scrollAlphabet('left')">
          <icon name="iconamoon:arrow-left-2" class="text-5xl text-celeste hover:text-white hover:bg-verde hover:rounded-full hover:border-verde" />
        </button>
        <!-- alphabet -->
        <div class="flex overflow-hidden" ref="alphabetContainer">
          <button 
            v-for="letter in alphabet" :key="letter" 
            class="px-4 py-2 rounded-full mx-1 whitespace-nowrap"
            :class="{'bg-celeste text-white': letter === selectedLetter, 'text-black font-bold hover:bg-celeste hover:text-white': letter !== selectedLetter}"
            @click="fetchPosts(letter)">
            {{ letter }}
          </button>
        </div>
        <!-- right arrow -->
        <button class="ml-2" @click="scrollAlphabet('right')">
          <icon name="iconamoon:arrow-right-2" class="text-5xl text-celeste hover:text-white hover:bg-verde hover:border hover:rounded-full hover:border-verde" />
        </button>
      </div>
      <div class="w-9/12 mx-auto flex overflow-x-auto mt-10 gap-4 px-4 pb-6" style="scroll-padding-right: 30px;">
        <div v-if="loading" class="w-full h-full flex items-center justify-center">
          <icon name="eos-icons:three-dots-loading" class="text-5xl text-celeste" />
        </div>
        <div v-else v-for="post in posts" :key="post.id" class="flex-none w-64 h-auto p-4 bg-white rounded-lg shadow">
          <img :src="post.featured_image_src" :alt="post.alt_text" class="w-full h-32 object-cover rounded-lg">
          <h2 class="mt-4 font-bold">{{ post.title }}</h2>
          <h3 class="italic text-gray-400">{{ post.meta_box_nome_scientifico }}</h3>
        </div>
      </div>
    </div>
  </section>
</template>


<script setup>
import { ref, onMounted, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useNuxtApp } from '#app';
import gql from 'graphql-tag';

const { apollo } = useNuxtApp();

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const selectedLetter = ref('A');
const allPosts = ref([]);
const posts = ref([]);
const alphabetContainer = ref(null);
const loading = ref(false);


const FETCH_ALL_POSTS = gql`
  query FetchAllPosts {
    posts(first: 100) {
      nodes {
        id
        title
        nomeScientifico
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

async function fetchAllPosts() {
  loading.value = true;
  try {
    const { result, loading: queryLoading, error } = useQuery(FETCH_ALL_POSTS, {}, { client: apollo });

    watchEffect(() => {
      if (result.value && result.value.posts) {
        allPosts.value = result.value.posts.nodes.map(post => ({
          id: post.id,
          title: post.title,
          featured_image_src: post.featuredImage.node.sourceUrl,
          alt_text: post.featuredImage.node.altText,
          meta_box_nome_scientifico: post.nomeScientifico
        }));
        console.log("Post ricevuti:", allPosts.value);
        posts.value = filterPostsByLetter(selectedLetter.value);
      } else {
        allPosts.value = [];
        console.log("Nessun post trovato, risposta:", result.value);
      }
    });

    watchEffect(() => {
      loading.value = queryLoading.value;
    });
    
    if (error.value) {
      console.error('Error fetching posts:', error.value);
      console.log(error.value);
    }
  } catch (e) {
    console.error('Error in fetchAllPosts method:', e);
    allPosts.value = [];
  }
}

function filterPostsByLetter(letter) {
  return allPosts.value.filter(post => post.title.startsWith(letter.toUpperCase()));
}

function fetchPosts(letter) {
  selectedLetter.value = letter;
  posts.value = filterPostsByLetter(letter);
}

function scrollAlphabet(direction) {
  if (direction === 'left') {
    alphabetContainer.value.scrollLeft -= 100;
  } else {
    alphabetContainer.value.scrollLeft += 100;
  }
}

onMounted(fetchAllPosts);
</script>



<style scoped>
.alphabet-section {
  background: rgb(224,237,253);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
}
</style>
