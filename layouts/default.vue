<template>
  <div>
    <Header></Header>
    <NuxtPage />
    <Footer></Footer>
  </div>
</template>

<script setup>
import Header from '~/components/header.vue';
import Footer from '~/components/footer.vue';

import { useHead } from '#app';

useHead({
  meta: [
    { name: 'robots', content: 'noindex' }
  ]
});
</script>

<style scoped>
@import '~/assets/css/main.css';
</style>
