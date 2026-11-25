<template>
  <Transition name="fade">
    <button
      v-show="y > 300"
      type="button"
      class="fixed bottom-20 right-6 bg-blu hover:bg-celeste text-white rounded-full p-2 w-12 h-12 shadow-lg transition-colors duration-300 z-50 flex items-center justify-center print:hidden"
      aria-label="Torna in cima"
      @click="scrollToTop"
    >
      <Icon name="mdi:chevron-up" class="w-6 h-6" />
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

const { y } = useWindowScroll()
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
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
