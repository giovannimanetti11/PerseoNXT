<template>
  <header ref="headerRef" class="fixed w-10/12 top-1 md:top-5 left-1/2 -translate-x-1/2 md:w-4/5 z-50 print:hidden">
    <div :class="['flex justify-between items-center bg-white py-2 px-2 md:py-4 md:px-6 shadow-lg rounded-2xl', { 'rounded-b-none': openPanel }]">
      <NuxtLink to="/" aria-label="Wikiherbalist, torna alla homepage" class="flex items-center">
        <img
          src="/media/logo_wikiherbalist.svg"
          alt="Wikiherbalist"
          width="144"
          height="19"
          class="w-28 lg:w-32 xl:w-36 mr-2"
          loading="eager"
        >
      </NuxtLink>

      <nav class="hidden lg:flex flex-grow justify-center space-x-1 xl:space-x-4 text-black text-sm xl:text-base" aria-label="Menu principale">
        <NuxtLink
          v-for="item in mainNav"
          :key="item.to"
          :to="item.to"
          class="py-2 px-1 xl:px-2 hover:text-verde transition-colors duration-300"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="flex items-center">
        <button
          type="button"
          class="hidden md:block py-1 px-5 mr-4 bg-white text-verde border border-verde hover:text-blu hover:border-blu rounded-md"
          :aria-expanded="openPanel === 'newsletter'"
          aria-controls="header-newsletter"
          @click="toggle('newsletter')"
        >
          Mailing list
        </button>
        <button
          type="button"
          class="hamburger flex flex-row items-center gap-1.5 md:ml-2"
          :class="{ active: openPanel === 'menu' }"
          :aria-expanded="openPanel === 'menu'"
          aria-controls="header-menu"
          aria-label="Menu"
          @click="toggle('menu')"
        >
          <span class="bar w-1.5 h-7 m-0.5 rounded-lg"></span>
          <span class="bar w-1.5 h-5 m-0.5 rounded-lg"></span>
          <span class="bar w-1.5 h-7 m-0.5 rounded-lg"></span>
        </button>
      </div>
    </div>

    <div
      v-if="openPanel === 'menu'"
      id="header-menu"
      class="w-full bg-white rounded-b-2xl max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide"
    >
      <div class="mx-auto px-4 py-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            :class="['mega-menu-button relative text-white py-4 px-4 bg-celeste rounded-lg w-full h-16 transition-colors duration-500 group hover:bg-verde flex items-center', { 'lg:hidden': item.mobileOnly }]"
          >
            <span class="absolute left-2 top-1/2 w-12 h-12 -translate-y-1/2 bg-white p-2 rounded-2xl flex justify-center items-center">
              <Icon :name="item.icon" class="text-celeste text-3xl group-hover:text-verde" />
            </span>
            <span class="absolute left-16 right-4 text-center">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <MailingList v-if="openPanel === 'newsletter'" id="header-newsletter" />
  </header>
</template>

<script setup lang="ts">
import { onClickOutside, onKeyStroke } from '@vueuse/core'

type Panel = 'menu' | 'newsletter'

const mainNav = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/piante-medicinali', label: 'Piante medicinali' },
  { to: '/glossario', label: 'Glossario' },
  { to: '/blog', label: 'Blog' },
]

const icons: Record<string, string> = {
  '/': 'mdi:home',
  '/about': 'mdi:information',
  '/piante-medicinali': 'mdi:flower',
  '/glossario': 'mdi:book-open-page-variant',
  '/blog': 'mdi:post',
}

// On desktop the main links are already in the top bar.
const menuItems = [
  ...mainNav.map((item) => ({ ...item, icon: icons[item.to] ?? 'mdi:link', mobileOnly: true })),
  { to: '/lavora-con-noi', label: 'Collabora con noi', icon: 'mdi:handshake', mobileOnly: false },
  { to: '/donazioni', label: 'Sostienici', icon: 'ph:heart', mobileOnly: false },
  { to: '/#section-contacts', label: 'Contattaci', icon: 'mdi:contact-mail', mobileOnly: false },
]

const openPanel = ref<Panel | null>(null)
const headerRef = ref<HTMLElement | null>(null)
const route = useRoute()

const toggle = (panel: Panel) => {
  openPanel.value = openPanel.value === panel ? null : panel
}

watch(() => route.fullPath, () => { openPanel.value = null })

onClickOutside(headerRef, () => { openPanel.value = null })
onKeyStroke('Escape', () => { openPanel.value = null })
</script>

<style scoped>
.bar {
  background-color: #a2b4c0;
  transition: all 0.4s cubic-bezier(0.455, 0.03, 0.515, 0.955);
}

.hamburger.active .bar:nth-child(1) {
  transform: translateX(-2px) rotate(-30deg);
  background-color: #036297;
}

.hamburger.active .bar:nth-child(2) {
  background-color: #0DA6A4;
  margin-top: 4px;
}

.hamburger.active .bar:nth-child(3) {
  transform: translateX(2px) rotate(30deg);
  background-color: #036297;
}
</style>
