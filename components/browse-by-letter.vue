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
      <!-- cards -->
      <div class="w-9/12 mx-auto flex overflow-x-auto mt-10 gap-4 px-4 pb-6" style="scroll-padding-right: 30px;">
        <div v-for="post in posts" :key="post.id" class="flex-none w-64 h-auto p-4 bg-white rounded-lg shadow">
          <img :src="post.featured_image_src" alt="Featured Image" class="w-full h-32 object-cover rounded-lg">
          <h2 class="mt-4 font-bold">{{ post.title.rendered }}</h2>
          <h3 class="italic text-gray-400">{{ post.meta_box_nome_scientifico }}</h3>
        </div>
      </div>
    </div>
  </section>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const selectedLetter = ref('A');
const posts = ref([]);
const alphabetContainer = ref(null);

const nuxtApp = useNuxtApp();
const fetchWP = nuxtApp.$fetchWP;

async function fetchPosts(letter) {
  selectedLetter.value = letter;
  const endpoint = `/wp/v2/posts?orderby=title&order=asc&filter[s]='${letter}'&per_page=100&_embed`;
  const fetchedPosts = await fetchWP(endpoint);

  if (fetchedPosts) {
    posts.value = fetchedPosts.map(post => ({
      id: post.id,
      title: post.title,
      featured_image_src: post._embedded['wp:featuredmedia'][0].source_url,
      meta_box_nome_scientifico: post['meta-box-nome-scientifico']
    })).filter(post => post.title.rendered.startsWith(letter));
  } else {
    posts.value = [];
  }
}

function scrollAlphabet(direction) {
  const container = alphabetContainer.value;
  if (container) {
    const scrollAmount = 100;
    const currentScroll = container.scrollLeft;
    container.scrollLeft = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;
  }
}

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
