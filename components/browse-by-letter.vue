<template>
    <section class="py-10 w-11/12 m-auto rounded-2xl alphabet-section">
      <div class="container mx-auto px-4 mt-4">
        <h3 class="text-4xl font-bold text-center text-black">Sfoglia le <span class="text-blu">monografie</span>, lettera per lettera</h3>
        <div class="flex justify-center mt-8">
          <div class="flex justify-center">
            <button 
              v-for="letter in alphabet" :key="letter" 
              class="px-4 py-2 rounded-full"
              :class="{'bg-blu text-white': letter === selectedLetter, 'text-black hover:bg-blu hover:text-white': letter !== selectedLetter}"
              @click="fetchPosts(letter)">
              {{ letter }}
            </button>
          </div>
        </div>
        <ul class="mt-10">
          <li v-for="post in posts" :key="post.id" class="mb-2">
            {{ post.title.rendered }}
          </li>
        </ul>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue';
  import { useNuxtApp } from '#app';
  
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const selectedLetter = ref('A');
  const posts = ref([]);
  
  const nuxtApp = useNuxtApp();
  const fetchWP = nuxtApp.$fetchWP;
  
  // Function to fetch posts based on the selected letter
  async function fetchPosts(letter) {
    selectedLetter.value = letter;
    let allPosts = [];
    let perPage = 70; 
    let page = 1;
    let hasMore = true;
  
    while (hasMore) {
      try {
        const fetchedPosts = await fetchWP(`/wp/v2/posts?orderby=title&order=asc&per_page=${perPage}&page=${page}`);
        if (fetchedPosts && fetchedPosts.length > 0) {
          allPosts = allPosts.concat(fetchedPosts);
          page++;
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error('Error fetching data from WordPress:', error);
        hasMore = false; 
      }
    }
  
    if (allPosts) {
      posts.value = allPosts.filter(post => post.title.rendered.startsWith(letter));
    } else {
      posts.value = [];
    }
  }
  
  watch(selectedLetter, (newLetter) => {
    fetchPosts(newLetter);
  });
  
  onMounted(() => {
    fetchPosts(selectedLetter.value);
  });
  </script>
  
  
  
  
  
  <style scoped>
  .alphabet-section {
    background: rgb(224,237,253);
    background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
  }
  </style>
