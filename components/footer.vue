<template>
  <div class="footer-section bg-ghiaccio text-black mt-6 py-8 md:py-14 w-11/12 m-auto rounded-2xl print:hidden">
    <div class="container mx-auto px-4">
      <!-- Mobile Layout -->
      <div class="md:hidden flex flex-col items-center">
        <!-- Logo -->
        <a href="https://wikinutritionals.com" aria-label="Home" class="w-full max-w-[200px]">
          <img
            src="/media/logo_wikiherbalist.svg"
            alt="Wikiherbalist Logo"
            class="w-full h-auto"
            loading="lazy"
          />
        </a>
        
        <!-- Menu (2 columns) -->
        <div class="grid grid-cols-2 gap-2 text-center mt-8 mb-8">
          <NuxtLink to="/glossario" class="hover:underline">Glossario</NuxtLink>
          <NuxtLink to="/newsletter" class="hover:underline">Newsletter</NuxtLink>
          <NuxtLink to="/contatti" class="hover:underline">Contattaci</NuxtLink>
          <NuxtLink to="/lavora-con-noi" class="hover:underline">Lavora con Noi</NuxtLink>
          <NuxtLink to="/eventi" class="hover:underline">Prossimi Eventi</NuxtLink>
          <NuxtLink to="/blog" class="hover:underline">Blog</NuxtLink>
          <NuxtLink to="/about" class="hover:underline">About</NuxtLink>
          <NuxtLink to="/piante-medicinali" class="hover:underline">Piante medicinali</NuxtLink>
        </div>
        
        <!-- Donation -->
        <div class="w-full flex flex-col items-center mb-8">
          <p class="text-lg font-semibold mb-2">Supporta la nostra attività di divulgazione</p>
          <button class="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-white hover:text-red-500 transition duration-300">
            <Icon name="ph:heart" class="text-3xl inline-block align-middle mr-2" />
            <span class="inline-block align-middle">Donazione</span>
          </button>
        </div>
        
        <!-- Social Icons -->
        <div class="flex justify-center space-x-4">
          <a href="#" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white w-12 h-12 flex items-center justify-center">
            <Icon name="uil:facebook-f" class="text-3xl" />
          </a>
          <a href="#" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white w-12 h-12 flex items-center justify-center">
            <Icon name="uil:instagram" class="text-3xl" />
          </a>
        </div>
      </div>

      <!-- Desktop Layout -->
      <div class="hidden md:flex flex-wrap -mx-4">
        <!-- Logo and Donation column -->
        <div class="w-1/4 px-4 flex flex-col items-start">
          <div class="w-full flex flex-col items-center">
            <a href="https://wikinutritionals.com" class="flex flex-col items-center text-center w-full max-w-[200px]">
              <img
                src="/media/logo_wikiherbalist.svg"
                alt="Wikiherbalist Logo"
                class="w-full h-auto mb-4"
                loading="lazy"
              />
              <p class="mt-4 text-lg font-semibold">Supporta la nostra attività di divulgazione</p>
              <button class="mt-4 w-auto bg-red-500 text-white py-2 px-4 rounded hover:bg-white hover:text-red-500 transition duration-300">
                <Icon name="ph:heart" class="text-3xl inline-block align-middle mr-2" />
                <span class="inline-block align-middle">Donazione</span>
              </button>
            </a>
          </div>
        </div>
        <!-- Menu columns and social icons wrapper -->
        <div class="w-3/4 flex flex-wrap">
          <!-- Social icons -->
          <div class="w-full flex justify-end mb-4">
            <a href="#" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white mr-2 w-12 h-12 flex items-center justify-center">
              <Icon name="uil:facebook-f" class="text-3xl" />
            </a>
            <a href="#" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white w-12 h-12 flex items-center justify-center">
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
                <NuxtLink to="/lavora-con-noi" class="hover:underline">Lavora con Noi</NuxtLink>
                <NuxtLink to="/eventi" class="hover:underline whitespace-nowrap">Prossimi Eventi</NuxtLink>
                <NuxtLink to="/contatti" class="hover:underline">Contattaci</NuxtLink>
              </div>
            </div>
            <div class="w-1/3 px-4 flex justify-center">
              <div class="flex flex-col space-y-2 items-center">
                <NuxtLink to="/newsletter" class="hover:underline">Newsletter</NuxtLink>
                <NuxtLink to="/privacy-policy" class="hover:underline">Privacy Policy</NuxtLink>
                <NuxtLink to="/cookie-policy" class="hover:underline">Cookie Policy</NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="flex flex-col md:flex-row justify-between items-center text-base text-black text-center m-auto px-4 md:px-14 py-2 w-11/12">
    <div class="text-sm mt-1.5 mb-2 md:mb-0">
      © Wikiherbalist - all rights reserved - 2024
    </div>
    <div class="text-sm mt-1.5">
      In sviluppo con <Icon name="logos:nuxt-icon" class="inline-block align-middle" size="1.5em" />&nbsp;
      <a href="https://nuxt.com/" target="_blank" rel="noopener noreferrer" class="hover:cursor-pointer hover:text-celeste text-verde">Nuxt 3</a> &nbsp;<Icon name="emojione:red-heart" class="inline-block align-middle" size="1.5em" />
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
</style>