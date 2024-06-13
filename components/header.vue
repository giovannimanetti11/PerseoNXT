<template>
  <header class="fixed top-5 left-1/2 transform -translate-x-1/2 w-4/5 z-50 print:hidden">
    <div :class="['flex justify-between items-center bg-white py-4 px-6 shadow-lg rounded-2xl', {'radius-bottom-none': menuOpen || mailingListMenuOpen}]">
      <div class="flex items-center">
        <a href="https://wikinutritionals.com">
          <img src="/media/logo_wikiherbalist.svg" alt="Wikiherbalist Logo" class="h-8 mr-2" loading="lazy">
        </a>
      </div>

      <div class="flex-grow">
        <nav class="flex justify-center space-x-4 text-black">
          <a href="https://wikinutritionals.com" class="no-underline py-2 px-2">Home</a>
          <a href="/about" class="no-underline py-2 px-2">About</a>
          <a href="/piante-medicinali" class="no-underline py-2 px-2">Piante medicinali</a>
          <a href="/glossario" class="no-underline py-2 px-2">Glossario</a>
          <a href="/blog" class="no-underline py-2 px-2">Blog</a>
        </nav>
      </div>

      <div class="flex items-center">
        <button class="buttonMailing py-1 px-5 mr-4 bg-white text-verde border border-verde hover:text-blu hover:border-blu rounded-md" @click="toggleMailingListMenu">Mailing List</button>
        <div class="hamburger-menu cursor-pointer flex flex-row items-center gap-1.5 ml-2" :class="{ 'active': menuOpen }" @click="toggleMenu">
          <div class="bar w-1.5 h-7 m-0.5 transition-all rounded-lg" :class="{ 'transform -translate-x-0.5 rotate-30': menuOpen }"></div>
          <div class="bar w-1.5 h-5 m-0.5 transition-all rounded-lg" :class="{ 'mt-1': menuOpen }"></div>
          <div class="bar w-1.5 h-7 m-0.5 transition-all rounded-lg" :class="{ 'transform translate-x-0.5 rotate-30': menuOpen }"></div>
        </div>
      </div>
    </div>

    <!-- Mega menu Hamburger -->
    <div v-if="menuOpen" class="w-full bg-white h-60 rounded-bl-2xl rounded-br-2xl transition-all duration-500 ease-out">
      <div class="container mx-auto px-4">
        <div class="flex">
          <!-- Left col -->
          <div class="w-1/3 mt-6">
            <p class="text-gray-700 font-bold text-lg">
              Seguici
            </p>
            <div class="flex space-x-2 mt-4">
              <div class="bg-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:cursor-pointer">
                <Icon name="uil:facebook-f" class="text-white text-3xl" />
              </div>
              <div class="bg-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:cursor-pointer">
                <Icon name="uil:instagram" class="text-white text-3xl" />
              </div>
            </div>
          </div>

          <!-- Right col -->
          <div class="w-2/3 flex justify-start items-center p-2">
            <div class="w-full grid grid-cols-2 gap-4">
              <div class="p-2">
                <button class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:event" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">Prossimi eventi</span>
                </button>
              </div>
              <div class="p-2">
                <button class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:contact-mail" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">Contattaci</span>
                </button>
              </div>
              <div class="p-2">
                <button class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:book-open-variant" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">Monografie</span>
                </button>
              </div>
              <div class="p-2">
                <button class="mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-all duration-500 ease-in-out group hover:bg-verde before:absolute before:inset-0 before:bg-verde before:border before:rounded-lg before:transition-all before:duration-300 before:ease-linear before:origin-left before:scale-x-0 hover:before:scale-x-100">
                  <div class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl border border-transparent flex justify-center items-center">
                    <Icon name="mdi:handshake" class="inner-icon text-celeste text-3xl group-hover:text-verde" />
                  </div>
                  <span class="absolute text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">Collabora con noi</span>
                </button>
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
