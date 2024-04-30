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
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';

// Define the alphabet and initial settings for selected letter and posts
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const selectedLetter = ref('A');
const posts = ref([]);

const nuxtApp = useNuxtApp();
const fetchWP = nuxtApp.$fetchWP;

// Function to fetch posts based on the selected letter with reduced API calls
async function fetchPosts(letter) {
  selectedLetter.value = letter;
  const endpoint = `/wp/v2/posts?orderby=title&order=asc&filter[s]='${letter}'&per_page=100`;
  const fetchedPosts = await fetchWP(endpoint);

  // Filter posts that start with the selected letter, considering potential caching issues
  if (fetchedPosts) {
    posts.value = fetchedPosts.filter(post => post.title.rendered.startsWith(letter));
  } else {
    posts.value = [];
  }
}

// Automatically fetch posts for the default letter 'A' on component mount
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
