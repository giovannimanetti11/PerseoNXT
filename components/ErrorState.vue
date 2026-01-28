<template>
  <div class="error-state mt-8" role="alert" aria-live="polite">
    <div class="max-w-lg mx-auto p-6 rounded-lg text-center">
      <!-- Icona errore -->
      <div class="mb-4">
        <svg
          v-if="type === 'error'"
          class="w-12 h-12 mx-auto text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <svg
          v-else
          class="w-12 h-12 mx-auto text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <!-- Titolo -->
      <p class="text-2xl font-semibold text-black mb-2">{{ title }}</p>

      <!-- Messaggio -->
      <p class="text-sm text-gray-600 mb-4">{{ message }}</p>

      <!-- Azioni -->
      <div v-if="showActions" class="flex justify-center gap-3">
        <button
          v-if="showRetry"
          @click="handleRetry"
          class="px-4 py-2 bg-blu text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blu focus:ring-offset-2"
          aria-label="Riprova a caricare i contenuti"
        >
          Ricarica
        </button>
        <NuxtLink
          v-if="showContact"
          to="/contact"
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
        >
          Contattaci
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'error' | 'empty'
  title?: string
  message?: string
  showRetry?: boolean
  showContact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'error',
  title: 'Ops — problema nel caricamento',
  message: 'Sembra ci sia stato un problema nel recuperare i dati. Prova a ricaricare la pagina o contattaci se il problema persiste.',
  showRetry: true,
  showContact: true
})

const emit = defineEmits<{
  retry: []
}>()

const showActions = computed(() => props.showRetry || props.showContact)

const handleRetry = () => {
  emit('retry')
  if (import.meta.client) {
    window.location.reload()
  }
}
</script>

<style scoped>
.error-state {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
