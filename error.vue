<template>
  <NuxtLayout>
    <div class="container mx-auto px-4 py-12 text-center">
      <h1 class="text-8xl font-bold text-blu mt-16 mb-2">OOPS!</h1>
      <p class="text-2xl font-semibold text-gray-700 mb-6">
        {{ errorMessage }}
      </p>
      <p class="text-gray-500 mb-8">{{ errorDescription }}</p>
      <div class="flex justify-center gap-4 flex-col sm:flex-row max-w-md mx-auto">
        <button @click="goHome" class="px-5 py-3 bg-verde hover:bg-emerald-500 text-white rounded-md transition-colors">
          Torna alla Home
        </button>
        <button @click="explorePlants" class="px-5 py-3 bg-celeste hover:bg-blu text-white rounded-md transition-colors">
          Esplora le Piante Medicinali
        </button>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, clearError } from '#app'

const props = defineProps({
  error: Object
})

const router = useRouter()

// Determine error message based on status code
const errorMessage = computed(() => {
  const statusCode = props.error?.statusCode || 500
  if (statusCode === 404) {
    return 'Pagina non trovata'
  } else if (statusCode >= 500) {
    return 'Errore del server'
  } else {
    return 'Qualcosa è andato storto'
  }
})

const errorDescription = computed(() => {
  const statusCode = props.error?.statusCode || 500
  if (statusCode === 404) {
    return 'La pagina che stai cercando non esiste o è stata spostata.'
  } else if (statusCode >= 500) {
    return 'Si è verificato un errore temporaneo. Riprova tra qualche minuto.'
  } else {
    return 'Si è verificato un errore imprevisto. Ti preghiamo di riprovare.'
  }
})

const goHome = () => {
  clearError({ redirect: '/' })
}

const explorePlants = () => {
  clearError()
  router.push('/piante-medicinali')
}

useHead({
  title: computed(() => `${errorMessage.value} | Wikiherbalist`),
  meta: [
    {
      name: 'description',
      content: computed(() => errorDescription.value)
    }
  ]
})
</script>