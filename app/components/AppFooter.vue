<template>
  <footer class="soft-gradient text-black mt-6 py-8 md:py-14 w-11/12 m-auto rounded-2xl print:hidden">
    <div class="mx-auto px-4 flex flex-col md:flex-row items-center md:items-start gap-10">
      <div class="flex flex-col items-center text-center w-full max-w-[220px] shrink-0">
        <NuxtLink to="/" aria-label="Wikiherbalist, torna alla homepage" class="w-full">
          <img src="/media/logo_wikiherbalist.svg" alt="Wikiherbalist" class="w-full h-auto mb-4" width="200" height="26">
        </NuxtLink>
        <p class="mt-2 text-lg font-semibold">Sostieni il progetto</p>
        <NuxtLink
          to="/donazioni"
          class="mt-4 inline-flex items-center bg-red-500 text-white py-2 px-4 rounded hover:bg-white hover:text-red-500 transition duration-300"
        >
          <Icon name="ph:heart" class="text-3xl mr-2" />
          Fai una donazione
        </NuxtLink>
      </div>

      <nav class="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-center md:text-left flex-grow" aria-label="Link del sito">
        <ul v-for="(column, index) in columns" :key="index" class="space-y-2">
          <li v-for="link in column" :key="link.to">
            <NuxtLink :to="link.to" class="hover:underline">{{ link.label }}</NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </footer>
  <div class="flex flex-col md:flex-row justify-between items-center text-sm text-black text-center m-auto px-4 md:px-14 py-2 w-11/12 print:hidden">
    <p class="mt-1.5 mb-2 md:mb-0">© {{ year }} Wikiherbalist</p>
    <p class="mt-1.5 flex items-center justify-center gap-1">
      Il codice del sito è open source:
      <a href="https://github.com/giovannimanetti11/PerseoNXT" target="_blank" rel="noopener noreferrer" class="hover:text-celeste inline-flex items-center gap-1">
        <Icon name="mdi:github" size="1.5em" />
        GitHub
      </a>
    </p>
  </div>
</template>

<script setup lang="ts">
const columns = [
  [
    { to: '/about', label: 'About' },
    { to: '/piante-medicinali', label: 'Piante medicinali' },
    { to: '/glossario', label: 'Glossario' },
    { to: '/blog', label: 'Blog' },
  ],
  [
    { to: '/lavora-con-noi', label: 'Lavora con noi' },
    { to: '/#section-contacts', label: 'Contattaci' },
    { to: '/donazioni', label: 'Donazioni' },
  ],
  [
    { to: '/privacy-policy', label: 'Privacy policy' },
    { to: '/cookie-policy', label: 'Cookie policy' },
    { to: '/disclaimer', label: 'Disclaimer' },
  ],
]

const year = new Date().getFullYear()
</script>
