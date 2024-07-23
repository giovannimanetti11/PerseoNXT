<template>
  <header class="fixed w-10/12 top-1 md:top-5 left-1/2 transform -translate-x-1/2 md:w-4/5 z-50 print:hidden">
    <div :class="['flex justify-between items-center bg-white py-2 px-2 md:py-4 md:px-6 shadow-lg rounded-2xl', {'radius-bottom-none': menuOpen || mailingListMenuOpen}]">
      <!-- Logo -->
      <div class="flex items-center">
        <a href="https://wikinutritionals.com">
          <img src="/media/logo_wikiherbalist.svg" alt="Wikiherbalist Logo" class="w-28 lg:w-32 xl:w-36 h-auto mr-2" loading="lazy">
        </a>
      </div>

      <!-- Desktop menu -->
      <div class="hidden lg:block flex-grow">
        <nav class="flex justify-center space-x-1 xl:space-x-4 text-black text-sm xl:text-base">
          <a href="https://wikinutritionals.com" class="no-underline py-2 px-1 xl:px-2">Home</a>
          <a href="/about" class="no-underline py-2 px-1 xl:px-2">About</a>
          <a href="/piante-medicinali" class="no-underline py-2 px-1 xl:px-2 whitespace-nowrap">Piante medicinali</a>
          <a href="/glossario" class="no-underline py-2 px-1 xl:px-2">Glossario</a>
          <a href="/blog" class="no-underline py-2 px-1 xl:px-2">Blog</a>
        </nav>
      </div>
      
      <!-- Hamburger e Mailing List button -->
      <div class="flex items-center">
        <button class="hidden md:block max-w-full buttonMailing py-1 px-5 mr-4 bg-white text-verde border border-verde hover:text-blu hover:border-blu rounded-md" @click="toggleMailingListMenu">Mailing List</button>
        <div class="hamburger-menu cursor-pointer flex flex-row items-center gap-1.5 md:ml-2" :class="{ 'active': menuOpen }" @click="toggleMenu">
          <div class="bar w-1.5 h-7 m-0.5 transition-all rounded-lg" :class="{ 'transform -translate-x-0.5 rotate-30': menuOpen }"></div>
          <div class="bar w-1.5 h-5 m-0.5 transition-all rounded-lg" :class="{ 'mt-1': menuOpen }"></div>
          <div class="bar w-1.5 h-7 m-0.5 transition-all rounded-lg" :class="{ 'transform translate-x-0.5 rotate-30': menuOpen }"></div>
        </div>
      </div>
    </div>

    <!-- Hamburger mega menu -->
    <div v-if="menuOpen" class="w-full bg-white rounded-bl-2xl rounded-br-2xl transition-all duration-500 ease-out max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col md:flex-row">
          <!-- Right col (on desktop, full width on mobile) -->
          <div class="w-full md:w-2/3 order-1 md:order-2 mb-6 md:mb-0">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Mobile-only menu items -->
              <div class="lg:hidden">
                <a href="https://wikinutritionals.com" class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100 flex items-center">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:home" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute left-16 right-4 text-center">Home</span>
                </a>
              </div>
              <div class="lg:hidden">
                <a href="/about" class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100 flex items-center">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:information" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute left-16 right-4 text-center">About</span>
                </a>
              </div>
              <div>
                <a href="/piante-medicinali" class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100 flex items-center">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:flower" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute left-16 right-4 text-center">Piante medicinali</span>
                </a>
              </div>
              <div class="lg:hidden">
                <a href="/glossario" class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100 flex items-center">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:book-open-page-variant" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute left-16 right-4 text-center">Glossario</span>
                </a>
              </div>
              <div class="lg:hidden">
                <a href="/blog" class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100 flex items-center">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:post" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute left-16 right-4 text-center">Blog</span>
                </a>
              </div>
              
              <!-- Original menu items -->
              <div>
                <button class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100 flex items-center">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:event" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute left-16 right-4 text-center">Prossimi eventi</span>
                </button>
              </div>
              <div>
                <button class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100 flex items-center">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:contact-mail" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute left-16 right-4 text-center">Contattaci</span>
                </button>
              </div>
              <div class="hidden lg:block">
                <a href="/piante-medicinali" class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100 flex items-center">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:book-open-variant" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute left-16 right-4 text-center">Monografie</span>
                </a>
              </div>
              <div>
                <button class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100 flex items-center">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:handshake" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute left-16 right-4 text-center">Collabora con noi</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Left col (on desktop, full width below menu on mobile) -->
          <div class="w-full md:w-1/3 order-2 md:order-1">
            <p class="text-gray-700 font-bold text-lg mb-4">
              Seguici
            </p>
            <div class="flex space-x-2">
              <div class="bg-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:cursor-pointer">
                <Icon name="uil:facebook-f" class="text-white text-3xl" />
              </div>
              <div class="bg-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:cursor-pointer">
                <Icon name="uil:instagram" class="text-white text-3xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Mega menu Mailing List -->
    <MailingList v-if="mailingListMenuOpen" @close="mailingListMenuOpen = false" />
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import MailingList from './mailinglist.vue';

const menuOpen = ref(false);
const mailingListMenuOpen = ref(false);

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
  if (menuOpen.value) mailingListMenuOpen.value = false;
};

const toggleMailingListMenu = () => {
  mailingListMenuOpen.value = !mailingListMenuOpen.value;
  if (mailingListMenuOpen.value) menuOpen.value = false;
};

const closeMenus = (event) => {
  if (!event.target.closest('.menu-container') && !event.target.closest('.hamburger-menu') && !event.target.closest('.buttonMailing')) {
    menuOpen.value = false;
    mailingListMenuOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closeMenus);
});

onUnmounted(() => {
  document.removeEventListener('click', closeMenus);
});
</script>

<style scoped>
.bar {
  background-color: #a2b4c0;
  transition: all 0.4s cubic-bezier(0.455, 0.03, 0.515, 0.955);
}

.hamburger-menu.active .bar:nth-child(1) {
  transform: translateX(-2px) rotate(-30deg);
  background-color: #036297;
}

.hamburger-menu.active .bar:nth-child(2) {
  background-color: #0DA6A4;
  margin-top: 4px;
}

.hamburger-menu.active .bar:nth-child(3) {
  transform: translateX(2px) rotate(30deg);
  background-color: #036297;
}
</style>