<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div 
        v-if="showBanner"
        class="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blu shadow-2xl z-40 max-h-screen overflow-y-auto"
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
      >
        <div class="container mx-auto px-4 py-4 sm:py-6 max-w-6xl">
          <!-- Close button -->
          <button
            @click="closeBanner"
            class="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors p-2"
            aria-label="Chiudi banner cookie"
          >
            <Icon name="heroicons:x-mark-20-solid" class="w-6 h-6" />
          </button>

          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pr-10 sm:pr-12">
            <div class="flex-1">
              <h3 id="cookie-banner-title" class="text-base sm:text-lg font-bold text-blu mb-2">
                🍪 Cookie e Privacy
              </h3>
              <p id="cookie-banner-description" class="text-xs sm:text-sm text-gray-700 leading-relaxed">
                Utilizziamo cookie tecnici necessari per il funzionamento del sito e cookie analitici per migliorare la tua esperienza. 
                Consulta la nostra 
                <NuxtLink to="/privacy-policy" class="text-blu hover:text-celeste underline font-semibold">
                  Privacy Policy
                </NuxtLink>
                e 
                <NuxtLink to="/cookie-policy" class="text-blu hover:text-celeste underline font-semibold">
                  Cookie Policy
                </NuxtLink>
                per maggiori informazioni.
              </p>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
              <button
                @click="acceptEssential"
                class="px-4 sm:px-6 py-2 text-sm sm:text-base border-2 border-blu text-blu rounded-lg hover:bg-ghiaccio transition-colors duration-300 font-semibold whitespace-nowrap"
                aria-label="Accetta solo cookie essenziali"
              >
                Solo Essenziali
              </button>
              <button
                @click="acceptAll"
                class="px-4 sm:px-6 py-2 text-sm sm:text-base bg-verde text-white rounded-lg hover:bg-celeste transition-colors duration-300 font-semibold whitespace-nowrap"
                aria-label="Accetta tutti i cookie"
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
import { ref, onMounted } from 'vue'

const showBanner = ref(false)

const COOKIE_CONSENT_KEY = 'wikiherbalist_cookie_consent'
const COOKIE_CONSENT_EXPIRY = 365 // giorni

interface CookieConsent {
  essential: boolean
  analytics: boolean
  timestamp: number
}

const setCookie = (name: string, value: string, days: number): void => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

const getCookie = (name: string): string | null => {
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

const saveConsent = (consent: CookieConsent): void => {
  const consentData = JSON.stringify(consent)
  setCookie(COOKIE_CONSENT_KEY, consentData, COOKIE_CONSENT_EXPIRY)
  localStorage.setItem(COOKIE_CONSENT_KEY, consentData)
}

const loadConsent = (): CookieConsent | null => {
  const cookieData = getCookie(COOKIE_CONSENT_KEY)
  const localData = localStorage.getItem(COOKIE_CONSENT_KEY)
  const data = cookieData || localData
  
  if (data) {
    try {
      return JSON.parse(data)
    } catch {
      return null
    }
  }
  return null
}

const closeBanner = (): void => {
  // Chiudere senza salvare = accetta solo essenziali
  acceptEssential()
}

const acceptEssential = (): void => {
  const consent: CookieConsent = {
    essential: true,
    analytics: false,
    timestamp: Date.now()
  }
  saveConsent(consent)
  showBanner.value = false
  
  // Disabilita Google Analytics se presente
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      analytics_storage: 'denied'
    })
  }
}

const acceptAll = (): void => {
  const consent: CookieConsent = {
    essential: true,
    analytics: true,
    timestamp: Date.now()
  }
  saveConsent(consent)
  showBanner.value = false
  
  // Abilita Google Analytics se presente
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      analytics_storage: 'granted'
    })
  }
}

onMounted(() => {
  // Controlla se l'utente ha già dato il consenso
  const existingConsent = loadConsent()
  
  if (!existingConsent) {
    // Mostra il banner dopo un breve delay per non essere invasivo
    setTimeout(() => {
      showBanner.value = true
    }, 1000)
  } else {
    // Applica le preferenze salvate
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: existingConsent.analytics ? 'granted' : 'denied'
      })
    }
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Assicura che il banner non si sovrapponga al survey */
@media (max-width: 768px) {
  /* Il survey ha z-index 30, il banner ha z-index 40 ma è posizionato più in basso */
}
</style>
