<template>
  <header class="fixed top-5 left-1/2 transform -translate-x-1/2 w-4/5 z-50">
    <div :class="['flex justify-between items-center bg-white py-4 px-6 rounded-2xl', {'radius-bottom-none': menuOpen || mailingListMenuOpen}]">
      <div class="flex items-center">
        <img :src="logoUrl" alt="WikiHerbalist Logo" class="h-8 mr-2" v-if="logoUrl">
      </div>

      <div class="flex-grow">
        <nav class="flex justify-center space-x-4 text-black">
          <a href="#" class="no-underline py-2 px-2">Home</a>
          <a href="#" class="no-underline py-2 px-2">About</a>
          <a href="#" class="no-underline py-2 px-2">Piante medicinali</a>
          <a href="#" class="no-underline py-2 px-2">Glossario</a>
          <a href="#" class="no-underline py-2 px-2">Blog</a>
        </nav>
      </div>

      <div class="flex items-center">
        <button class="buttonMailing mr-4" @click="toggleMailingListMenu">Mailing List</button>
        <div class="hamburger-menu cursor-pointer flex flex-row items-center gap-1.5 ml-2" :class="{ 'active': menuOpen }" @click="toggleMenu">
          <div class="bar rounded-lg"></div>
          <div class="bar rounded-lg"></div>
          <div class="bar rounded-lg"></div>
        </div>
      </div>
    </div>

    <!-- Mega menu Hamburger -->

    <div v-if="menuOpen" class="w-full bg-white h-60 rounded-bl-2xl rounded-br-2xl transition-all duration-500 ease-out">
    </div>

    <!-- Mega menu Mailing List -->

    <div v-if="mailingListMenuOpen" class="w-full bg-white h-60 rounded-bl-2xl rounded-br-2xl transition-all duration-500 ease-out">
    </div>

  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const logoUrl = ref('');

onMounted(async () => {
  try {
    const settings = await useNuxtApp().$fetchWP('/wp/v2/settings');
    if (settings.site_logo) {
      const media = await useNuxtApp().$fetchWP(`/wp/v2/media/${settings.site_logo}`);
      logoUrl.value = media.source_url;
    } else {
      logoUrl.value = settings.site_icon_url;
    }
  } catch (error) {
    console.error('Error fetching data from WordPress:', error);
  }
});

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
  if (!event.target.closest('.menu-container')) {
    menuOpen.value = false;
    mailingListMenuOpen.value = false;
  }
};

</script>

<style scoped>

.bar {
  background-color: #a2b4c0;
  width: 6px;
  height: 28px;
  margin: 0 2px;
  transition: all 0.4s cubic-bezier(0.455, 0.03, 0.515, 0.955);
}

.bar:nth-child(2) {
  height: 21px; 
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

.buttonMailing {
  background-color: white;
  color: #0DA6A4;
  border: 1px solid #0DA6A4; 
  border-radius: 8px;
  padding: 5px 20px;
}

.buttonMailing:hover {
  color: #036297;
  border: 1px solid #036297;
}

nav a:hover {
  color: #0DA6A4;
}

.radius-bottom-none {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}


</style>