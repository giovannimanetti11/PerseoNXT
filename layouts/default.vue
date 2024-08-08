<template>
  <div>
    <Header />
    <slot />
    <Footer />
    <ScrollToTopButton />
  </div>
</template>

<script setup>
import Header from '~/components/header.vue';
import Footer from '~/components/footer.vue';
import ScrollToTopButton from '~/components/scrollToTop.vue';
</script>