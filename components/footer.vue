<template>
  <footer class="footer-section bg-ghiaccio text-black mt-6 py-8 md:py-14 w-11/12 m-auto rounded-2xl print:hidden">
    <div class="container mx-auto px-4">
      <!-- Mobile Layout -->
      <div class="md:hidden flex flex-col items-center">
        <!-- Logo -->
        <NuxtLink to="/" aria-label="Home" class="w-full max-w-[200px]">
          <img
            src="/media/logo_wikiherbalist.svg"
            alt="Wikiherbalist Logo"
            class="w-full h-auto mb-4"
            width="200"
            height="56"
          />
        </NuxtLink>
        
        <!-- Menu (2 columns) -->
        <div class="grid grid-cols-2 gap-2 text-center mt-8 mb-8">
          <NuxtLink to="/glossario" class="hover:underline">Glossario</NuxtLink>
          <NuxtLink to="/piante-medicinali" class="hover:underline">Piante medicinali</NuxtLink>
          <NuxtLink to="/blog" class="hover:underline">Blog</NuxtLink>
          <NuxtLink to="/about" class="hover:underline">About</NuxtLink>
          <NuxtLink to="/#section-contacts" class="hover:underline">Contattaci</NuxtLink>
          <span class="hover:underline">Lavora con Noi</span>
          <span class="hover:underline">Prossimi Eventi</span>
          <span class="hover:underline">Newsletter</span>
          <NuxtLink to="/disclaimer" class="hover:underline">Disclaimer</NuxtLink>
        </div>
        
        <!-- Donation -->
        <div class="w-full flex flex-col items-center mb-8">
          <p class="text-lg font-semibold mb-2">Supporta la nostra attività di divulgazione</p>
          <NuxtLink to="/donazioni" class="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-white hover:text-red-500 transition duration-300">
            <Icon name="ph:heart" class="text-3xl inline-block align-middle mr-2" />
            <span class="inline-block align-middle">Donazione</span>
          </NuxtLink>
        </div>
        
        <!-- Social Icons -->
        <div class="flex justify-center space-x-4">
          <a href="#" aria-label="Facebook" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white w-12 h-12 flex items-center justify-center">
            <Icon name="uil:facebook-f" class="text-3xl" />
          </a>
          <a href="#" aria-label="Instagram" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white w-12 h-12 flex items-center justify-center">
            <Icon name="uil:instagram" class="text-3xl" />
          </a>
        </div>
      </div>

      <!-- Desktop Layout -->
      <div class="hidden md:flex flex-wrap -mx-4">
        <!-- Logo and Donation column -->
        <div class="w-1/4 px-4 flex flex-col items-start">
          <div class="w-full flex flex-col items-center">
            <div class="flex flex-col items-center text-center w-full max-w-[200px]">
              <img
                src="/media/logo_wikiherbalist.svg"
                alt="Wikiherbalist Logo"
                class="w-full h-auto mb-4"
                width="200"
                height="56"
              />
              <p class="mt-4 text-lg font-semibold">Supporta la nostra attività di divulgazione</p>
            </div>
            <NuxtLink to="/donazioni" class="flex flex-col items-center text-center w-full max-w-[200px]">
              <button class="mt-4 w-auto bg-red-500 text-white py-2 px-4 rounded hover:bg-white hover:text-red-500 transition duration-300">
                <Icon name="ph:heart" class="text-3xl inline-block align-middle mr-2" />
                <span class="inline-block align-middle">Donazione</span>
              </button>
            </NuxtLink>
          </div>
        </div>
        <!-- Menu columns and social icons wrapper -->
        <div class="w-3/4 flex flex-wrap">
          <!-- Social icons -->
          <div class="w-full flex justify-end mb-4">
            <a href="#" aria-label="Facebook" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white mr-2 w-12 h-12 flex items-center justify-center">
              <Icon name="uil:facebook-f" class="text-3xl" />
            </a>
            <a href="#" aria-label="Instagram" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white w-12 h-12 flex items-center justify-center">
              <Icon name="uil:instagram" class="text-3xl" />
            </a>
          </div>
          <!-- Menu columns -->
          <div class="w-full flex flex-wrap justify-between">
            <div class="w-1/3 px-4 flex justify-center">
              <div class="flex flex-col space-y-2 items-center">
                <NuxtLink to="/about" class="hover:underline">About</NuxtLink>
                <NuxtLink to="/piante-medicinali" class="hover:underline whitespace-nowrap">Piante medicinali</NuxtLink>
                <NuxtLink to="/glossario" class="hover:underline">Glossario</NuxtLink>
                <NuxtLink to="/blog" class="hover:underline">Blog</NuxtLink>
              </div>
            </div>
            <div class="w-1/3 px-4 flex justify-center">
              <div class="flex flex-col space-y-2 items-center">
                <div class="relative">
                  <span class="text-gray-600">Lavora con Noi</span>
                  <img src="@/assets/coming_soon.svg" alt="Coming Soon" class="absolute top-0 -right-16 w-16 h-auto" />
                </div>
                <div class="relative">
                  <span class="text-gray-600">Prossimi Eventi</span>
                  <img src="@/assets/coming_soon.svg" alt="Coming Soon" class="absolute top-0 -right-16 w-16 h-auto" />
                </div>
                <div class="relative">
                  <span class="text-gray-600">Newsletter</span>
                  <img src="@/assets/coming_soon.svg" alt="Coming Soon" class="absolute top-0 -right-16 w-16 h-auto" />
                </div>
                <NuxtLink to="/#section-contacts" class="hover:underline">Contattaci</NuxtLink>
              </div>
            </div>
            <div class="w-1/3 px-4 flex justify-center">
              <div class="flex flex-col space-y-2 items-center">
                <NuxtLink to="/privacy-policy" class="hover:underline">Privacy Policy</NuxtLink>
                <NuxtLink to="/cookie-policy" class="hover:underline">Cookie Policy</NuxtLink>
                <NuxtLink to="/disclaimer" class="hover:underline">Disclaimer</NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
  <div class="flex flex-col md:flex-row justify-between items-center text-base text-black text-center m-auto px-4 md:px-14 py-2 w-11/12">
    <div class="text-sm mt-1.5 mb-2 md:mb-0">
      © Wikiherbalist - all rights reserved - {{ currentYear }}
    </div>
    <div class="text-sm mt-1.5 flex items-center justify-center gap-1">
      Un progetto Open Source
      <a href="https://github.com/giovannimanetti11/PerseoNXT" target="_blank" rel="noopener noreferrer" class="hover:text-celeste inline-flex items-center gap-1">
        <Icon name="mdi:github" class="inline-block align-middle" size="1.5em" />
        Contribuisci
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.footer-section {
  background: rgb(224,237,253);
  background: linear-gradient(180deg, rgba(224,237,253,1) 0%, rgba(245,245,245,1) 82%);
}
</style>