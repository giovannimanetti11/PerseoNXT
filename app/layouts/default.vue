<template>
  <div>
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow"
    >
      Vai al contenuto principale
    </a>
    <AppHeader />
    <main id="main-content">
      <slot />
    </main>
    <AppFooter />
    <ClientOnly>
      <ScrollToTop />
      <template v-if="idle">
        <LazyFeedbackWidget />
        <LazyCookieBanner />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// Feedback widget and cookie banner are loaded once the browser is idle so
// they never compete with the page content.
const idle = ref(false)

onMounted(() => {
  const show = () => { idle.value = true }
  if ('requestIdleCallback' in window) window.requestIdleCallback(show, { timeout: 2000 })
  else setTimeout(show, 800)
})
</script>
