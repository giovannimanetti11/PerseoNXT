<template>
  <div class="mt-8 animate-[fadeIn_0.3s_ease-in-out]" role="alert">
    <div class="max-w-lg mx-auto p-6 rounded-lg text-center">
      <Icon
        :name="type === 'error' ? 'heroicons:exclamation-triangle' : 'heroicons:face-frown'"
        :class="['w-12 h-12 mx-auto mb-4', type === 'error' ? 'text-red-400' : 'text-gray-400']"
      />
      <p class="text-2xl font-semibold text-black mb-2">{{ title }}</p>
      <p class="text-sm text-gray-600 mb-4">{{ message }}</p>
      <div v-if="showRetry || showContact" class="flex justify-center gap-3">
        <button
          v-if="showRetry"
          type="button"
          class="px-4 py-2 bg-blu text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blu focus:ring-offset-2"
          @click="reload"
        >
          Ricarica
        </button>
        <NuxtLink v-if="showContact" to="/#section-contacts" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">
          Contattaci
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'error' | 'empty'
  title?: string
  message?: string
  showRetry?: boolean
  showContact?: boolean
}>(), {
  type: 'error',
  title: 'Problema nel caricamento',
  message: 'I dati non sono arrivati. Ricarica la pagina; se il problema continua, scrivici.',
  showRetry: true,
  showContact: true,
})

const reload = () => window.location.reload()
</script>
