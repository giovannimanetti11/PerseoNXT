<template>
  <div>
    <Header />
    <slot />
    <Footer />
    <ClientOnly>
      <ScrollToTop />
    </ClientOnly>
    <ClientOnly>
      <component :is="FeedbackWidget" v-if="showFeedback" />
      <component :is="CookieBanner" v-if="showCookieBanner" />
    </ClientOnly>
  </div>
</template>

<script setup>
import { defineAsyncComponent, ref, onMounted } from 'vue'

const FeedbackWidget = defineAsyncComponent(() => import('~/components/feedbackWidget.vue'))
const CookieBanner = defineAsyncComponent(() => import('~/components/cookieBanner.vue'))
const showFeedback = ref(false)
const showCookieBanner = ref(false)

onMounted(() => {
  const runIdle = (cb) => ('requestIdleCallback' in window)
    ? requestIdleCallback(cb, { timeout: 2000 })
    : setTimeout(cb, 800)
  runIdle(() => { 
    showFeedback.value = true
    showCookieBanner.value = true
  })
})
</script>