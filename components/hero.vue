<template>
  <!-- Section hero -->
  <section class="hero-section py-14 w-11/12 m-auto rounded-2xl">
    <div class="container mx-auto px-4 mt-24">
      <h2 class="text-5xl font-bold text-center text-black">Erbe aromatiche e medicinali</h2>
      <p class="text-center text-lg mt-2 text-black">
        Le schede monografiche delle 61 erbe presenti su WikiHerbalist illustrano erbe officinali e erbe aromatiche.
      </p>
    </div>
  </section>

  <!-- Search Field -->
  <div class="relative w-full flex justify-center items-center -mt-4">
      <searchfield />
  </div>

  <!-- Section by letter -->
  <section class="-mt-4 py-10 w-11/12 m-auto rounded-2xl alphabet-section">
    <div class="container mx-auto px-4 mt-4">
      <h3 class="text-5xl font-bold text-center text-black">Sfoglia le monografie, lettera per lettera</h3>
      <div class="flex justify-center mt-8">
        <!-- Alphabet -->
        <div class="flex justify-center">
          <button 
            v-for="letter in alphabet" :key="letter" 
            class="px-4 py-2 rounded-full"
            :class="{'bg-blue-500 text-white': letter === selectedLetter, 'text-black': letter !== selectedLetter}"
            @click="selectedLetter = letter">
            {{ letter }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import Searchfield from '~/components/searchfield.vue';

// Alphabet array
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const selectedLetter = ref('A');
</script>

<style scoped>

.hero-section {
    background: #DFEDFD;
    background: linear-gradient(153deg, rgba(13, 166, 164, 0.45) 0%, #DFEDFD 100%);
    background: -webkit-linear-gradient(153deg, rgba(13, 166, 164, 0.45) 0%, #DFEDFD 100%);
    background: -moz-linear-gradient(153deg, rgba(13, 166, 164, 0.45) 0%, #DFEDFD 100%);
    background: -o-linear-gradient(153deg, rgba(13, 166, 164, 0.45) 0%, #DFEDFD 100%);
    position: relative;
}

.alphabet-section {
  background: rgb(224,237,253);
  background: -moz-linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
  background: -webkit-linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#e0edfd",endColorstr="#f5f5f5",GradientType=1);
}


</style>
