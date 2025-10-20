<template>
  <div>
    <Header />
    <slot />
    <Footer />
    <ScrollToTop />
    <ClientOnly>
      <component :is="FeedbackWidget" v-if="showFeedback" />
    </ClientOnly>
  </div>
</template>

<script setup>
import { defineAsyncComponent, ref, onMounted } from 'vue'

const FeedbackWidget = defineAsyncComponent(() => import('~/components/feedbackWidget.vue'))
const showFeedback = ref(false)

onMounted(() => {
  const runIdle = (cb) => ('requestIdleCallback' in window)
    ? requestIdleCallback(cb, { timeout: 2000 })
    : setTimeout(cb, 800)
  runIdle(() => { showFeedback.value = true })
})
</script>