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
</script>

<style scoped>
@import '~/assets/css/main.css';
</style>
