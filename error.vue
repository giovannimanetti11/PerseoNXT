<template>
  <NuxtLayout>
    <div class="container mx-auto px-4 py-12 text-center">
      <h1 class="text-8xl font-bold text-blu mt-16 mb-2">404</h1>
      <p class="text-2xl font-semibold text-gray-700 mb-6">Pagina non trovata</p>
      <p class="text-gray-500 mb-8">La pagina che stai cercando non esiste o è stata spostata.</p>
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
import { useRouter, clearError } from '#app'

const router = useRouter()

const goHome = () => {
  clearError({ redirect: '/' })
}

const explorePlants = () => {
  clearError()
  router.push('/piante-medicinali')
}

useHead({
  title: '404 - Pagina non trovata | Wikiherbalist',
  meta: [
    {
      name: 'description',
      content: 'Pagina non trovata'
    }
  ]
})
</script>