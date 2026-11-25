<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div
        v-if="visible"
        class="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blu shadow-2xl z-40 max-h-screen overflow-y-auto"
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
      >
        <div class="relative mx-auto px-4 py-4 sm:py-6 max-w-6xl">
          <button
            type="button"
            class="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors p-2"
            aria-label="Chiudi e accetta solo i cookie tecnici"
            @click="save(false)"
          >
            <Icon name="heroicons:x-mark-20-solid" class="w-6 h-6" />
          </button>

          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pr-10 sm:pr-12">
            <div class="flex-1">
              <h2 id="cookie-banner-title" class="text-base sm:text-lg font-bold text-blu mb-2">🍪 Cookie e Privacy</h2>
              <p id="cookie-banner-description" class="text-xs sm:text-sm text-gray-700 leading-relaxed">
                Usiamo cookie tecnici, necessari al funzionamento del sito, e cookie analitici di Google Analytics,
                attivi solo con il tuo consenso. I dettagli sono nella
                <NuxtLink to="/privacy-policy" class="text-blu hover:text-celeste underline font-semibold">privacy policy</NuxtLink>
                e nella
                <NuxtLink to="/cookie-policy" class="text-blu hover:text-celeste underline font-semibold">cookie policy</NuxtLink>.
              </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
              <button
                type="button"
                class="px-4 sm:px-6 py-2 text-sm sm:text-base border-2 border-blu text-blu rounded-lg hover:bg-ghiaccio transition-colors duration-300 font-semibold whitespace-nowrap"
                @click="save(false)"
              >
                Solo Essenziali
              </button>
              <button
                type="button"
                class="px-4 sm:px-6 py-2 text-sm sm:text-base bg-verde text-white rounded-lg hover:bg-celeste transition-colors duration-300 font-semibold whitespace-nowrap"
                @click="save(true)"
              >
                Accetta Tutti
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface CookieConsent {
  essential: true
  analytics: boolean
  timestamp: number
}

const STORAGE_KEY = 'wikiherbalist_cookie_consent'
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

// The cookie is the source of truth; localStorage is a fallback for browsers
// that drop first-party cookies early.
const consentCookie = useCookie<CookieConsent | null>(STORAGE_KEY, {
  maxAge: ONE_YEAR_SECONDS,
  sameSite: 'lax',
  path: '/',
  default: () => null,
})
const visible = ref(false)

function isConsent(value: unknown): value is CookieConsent {
  return typeof value === 'object' && value !== null && 'analytics' in value && typeof value.analytics === 'boolean'
}

function storedConsent(): CookieConsent | null {
  if (isConsent(consentCookie.value)) return consentCookie.value
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return isConsent(parsed) ? parsed : null
  } catch {
    return null
  }
}

function applyConsent(analytics: boolean) {
  window.gtag?.('consent', 'update', { analytics_storage: analytics ? 'granted' : 'denied' })
  window.dispatchEvent(new CustomEvent('perseo:analytics-consent', { detail: { analytics } }))
}

function save(analytics: boolean) {
  const consent: CookieConsent = { essential: true, analytics, timestamp: Date.now() }
  consentCookie.value = consent
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
  } catch {
    // storage disabled: the cookie is enough
  }
  applyConsent(analytics)
  visible.value = false
}

onMounted(() => {
  const consent = storedConsent()
  if (consent) applyConsent(consent.analytics)
  else setTimeout(() => { visible.value = true }, 1000)
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
