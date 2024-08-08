<template>
    <Transition name="fade">
      <button
        v-show="showButton"
        @click="scrollToTop"
        class="fixed bottom-20 right-6 bg-blu hover:bg-celeste text-white rounded-full p-2 shadow-lg transition-all duration-300 z-50"
        aria-label="Torna in cima"
      >
        <Icon name="mdi:chevron-up" class="w-6 h-6" />
      </button>
    </Transition>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  
  const showButton = ref(false);
  
  const checkScroll = () => {
    showButton.value = window.scrollY > 300;
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  onMounted(() => {
    window.addEventListener('scroll', checkScroll);
    checkScroll();
  });
  
  onUnmounted(() => {
    window.removeEventListener('scroll', checkScroll);
  });
  </script>
  
  <style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  </style>