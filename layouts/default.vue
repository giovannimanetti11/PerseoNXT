<template>
  <div>
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow">
      Vai al contenuto principale
    </a>
    <Header />
    <main id="main-content">
      <slot />
    </main>
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
import { useHead } from '#app'

useHead({ htmlAttrs: { lang: 'it' } })

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