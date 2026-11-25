<template>
  <NuxtLayout>
    <div class="container mx-auto px-4 py-12 text-center">
      <h1 class="text-8xl font-bold text-blu mt-16 mb-2">Oops!</h1>
      <p class="text-2xl font-semibold text-gray-700 mb-6">{{ copy.title }}</p>
      <p class="text-gray-500 mb-8">{{ copy.description }}</p>
      <div class="flex justify-center gap-4 flex-col sm:flex-row max-w-md mx-auto">
        <button type="button" class="px-5 py-3 bg-verde hover:bg-emerald-500 text-white rounded-md transition-colors" @click="leave('/')">
          Torna alla home
        </button>
        <button type="button" class="px-5 py-3 bg-celeste hover:bg-blu text-white rounded-md transition-colors" @click="leave('/piante-medicinali')">
          Esplora le piante medicinali
        </button>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const copy = computed(() => {
  const status = props.error.statusCode || 500
  if (status === 404) {
    return { title: 'Pagina non trovata', description: 'La pagina che cerchi non esiste o è stata spostata.' }
  }
  if (status >= 500) {
    return { title: 'Errore del server', description: 'Il contenuto non è raggiungibile in questo momento. Riprova tra qualche minuto.' }
  }
  return { title: 'Qualcosa è andato storto', description: 'Si è verificato un errore imprevisto. Riprova.' }
})

const leave = (path: string) => clearError({ redirect: path })

useSeoMeta({
  title: () => copy.value.title,
  description: () => copy.value.description,
  robots: 'noindex',
})
</script>
