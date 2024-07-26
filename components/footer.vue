<template>
  <div class="footer-section bg-ghiaccio text-black mt-6 py-8 md:py-14 w-11/12 m-auto rounded-2xl print:hidden">
    <div class="container mx-auto px-4">
      <div class="flex flex-wrap -mx-4">
        <!-- Donation column -->
        <div class="w-full px-4 mb-8 md:mb-0 md:w-1/4 flex flex-col items-start">
          <div class="w-full flex flex-col items-center">
            <a href="https://wikinutritionals.com" class="flex flex-col items-center text-center">
              <img src="/media/logo_wikiherbalist.svg" alt="Wikiherbalist Logo" class="h-auto w-full max-w-[200px] mb-4">
              <p class="mt-4 text-lg font-semibold">Supporta la nostra attività di divulgazione</p>
              <button class="mt-4 w-full md:w-auto bg-red-500 text-white py-2 px-4 rounded hover:bg-white hover:text-red-500 transition duration-300">
                <Icon name="ph:heart" class="text-3xl inline-block align-middle mr-2" />
                <span class="inline-block align-middle">Donazione</span>
              </button>
            </a>
          </div>
        </div>
        <!-- Menu columns and social icons wrapper -->
        <div class="w-full md:w-3/4 flex flex-wrap">
          <!-- Menu columns -->
          <div class="w-full md:w-9/12 flex flex-wrap justify-center">
            <div class="w-full sm:w-1/3 px-4 mb-4 sm:mb-0 flex justify-center">
              <div class="flex flex-col space-y-2 items-center">
                <a href="#" class="hover:underline">Glossario</a>
                <a href="#" class="hover:underline">Newsletter</a>
                <a href="#" class="hover:underline">Contattaci</a>
              </div>
            </div>
            <div class="w-full sm:w-1/3 px-4 mb-4 sm:mb-0 flex justify-center">
              <div class="flex flex-col space-y-2 items-center">
                <a href="#" class="hover:underline">Lavora con Noi</a>
                <a href="#" class="hover:underline whitespace-nowrap">Prossimi Eventi</a>
                <a href="#" class="hover:underline">Blog</a>
              </div>
            </div>
            <div class="w-full sm:w-1/3 px-4 mb-4 sm:mb-0 flex justify-center">
              <div class="flex flex-col space-y-2 items-center">
                <a href="#" class="hover:underline">About</a>
                <a href="#" class="hover:underline">Privacy Policy</a>
                <a href="#" class="hover:underline">Cookie Policy</a>
              </div>
            </div>
          </div>
          <!-- Social icons -->
          <div class="w-full md:w-3/12 flex justify-center md:justify-end md:pr-8 mt-8 md:mt-0 items-start">
            <a href="#" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white mr-2 w-12 h-12 flex items-center justify-center">
              <Icon name="uil:facebook-f" class="text-3xl" />
            </a>
            <a href="#" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white w-12 h-12 flex items-center justify-center">
              <Icon name="uil:instagram" class="text-3xl" />
            </a>
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
      In sviluppo con <Icon name="logos:nuxt-icon" style="vertical-align: middle;" size="1.5em" />&nbsp;
      <a href="https://nuxt.com/" class="hover:cursor-pointer hover:text-celeste text-verde">Nuxt 3</a> &nbsp;<Icon name="emojione:red-heart" style="vertical-align: middle;" size="1.5em" />
    </div>
  </div>
</template>

<style scoped>
.footer-section {
  position: relative;
}
</style>