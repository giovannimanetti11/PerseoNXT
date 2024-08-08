<template>
    <div>
      <button
        @click="openModal"
        class="fixed bottom-32 right-6 bg-verde hover:bg-celeste text-white rounded-full p-2 shadow-lg transition-all duration-300 z-50"
        aria-label="Proponi modifica"
      >
        <Icon name="mdi:pencil" class="w-6 h-6" />
      </button>
  
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeModal">
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative" @click.stop>
              <button @click="closeModal" class="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                <Icon name="mdi:close" class="w-6 h-6" />
              </button>
              <div class="flex items-center text-black mb-4">
                <Icon name="mdi:pencil" class="text-3xl mr-2" />
                <h2 class="text-2xl font-bold">Proponi una modifica</h2>
              </div>
              <form @submit.prevent="submitProposal">
                <div class="mb-4 flex space-x-4">
                  <div class="w-1/2">
                    <label for="nome" class="block mb-2">Nome:</label>
                    <input
                      v-model="nome"
                      type="text"
                      id="nome"
                      class="w-full border rounded p-2"
                      placeholder="Es. Mario"
                      required
                    />
                  </div>
                  <div class="w-1/2">
                    <label for="cognome" class="block mb-2">Cognome:</label>
                    <input
                      v-model="cognome"
                      type="text"
                      id="cognome"
                      class="w-full border rounded p-2"
                      placeholder="Es. Rossi"
                      required
                    />
                  </div>
                </div>
                <div class="mb-4">
                  <label for="email" class="block mb-2">Email:</label>
                  <input
                    v-model="email"
                    type="email"
                    id="email"
                    class="w-full border rounded p-2"
                    placeholder="Es. mario.rossi@email.com"
                    required
                  />
                </div>
                <div class="mb-4">
                  <label for="titoloStudio" class="block mb-2">Titolo di studio:</label>
                  <input
                    v-model="titoloStudio"
                    type="text"
                    id="titoloStudio"
                    class="w-full border rounded p-2"
                    placeholder="Es. Laurea in Biologia"
                  />
                </div>
                <div class="mb-4">
                  <label for="affiliazione" class="block mb-2">Affiliazione:</label>
                  <input
                    v-model="affiliazione"
                    type="text"
                    id="affiliazione"
                    class="w-full border rounded p-2"
                    placeholder="Es. Università di Bologna"
                  />
                </div>
                <div class="mb-4">
                  <label for="section" class="block mb-2">Sezione da modificare:</label>
                  <select v-model="selectedSection" id="section" class="w-full border rounded p-2">
                    <option value="">Seleziona una sezione</option>
                    <option v-for="section in sections" :key="section" :value="section">
                      {{ section }}
                    </option>
                  </select>
                </div>
                <div class="mb-4">
                  <label for="proposal" class="block mb-2">La tua proposta:</label>
                  <textarea
                    v-model="proposal"
                    id="proposal"
                    rows="6"
                    class="w-full border rounded p-2"
                    placeholder="Scrivi qui la tua proposta di modifica..."
                  ></textarea>
                </div>
                <div class="mb-4">
                  <label for="reason" class="block mb-2">Motivazione della modifica:</label>
                  <textarea
                    v-model="reason"
                    id="reason"
                    rows="3"
                    class="w-full border rounded p-2"
                    placeholder="Spiega brevemente perché proponi questa modifica..."
                  ></textarea>
                </div>
                
                <!-- reCAPTCHA -->
                <div class="mb-4">
                  <div ref="recaptchaContainer"></div>
                </div>
  
                <div class="flex justify-end">
                  <button
                    type="button"
                    @click="closeModal"
                    class="mr-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    class="px-4 py-2 bg-blu text-white rounded hover:bg-celeste"
                    :disabled="isSubmitting"
                  >
                    {{ isSubmitting ? 'Invio in corso...' : 'Invia proposta' }}
                  </button>
                </div>
              </form>
              <div v-if="feedback" :class="['mt-4 p-2 rounded', feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']">
                {{ feedback.message }}
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { useNuxtApp } from '#app';
  
  const { $recaptcha } = useNuxtApp();
  
  const route = useRoute();

  // Use refs for reactive state handling

  const showModal = ref(false);
  const nome = ref('');
  const cognome = ref('');
  const email = ref('');
  const titoloStudio = ref('');
  const affiliazione = ref('');
  const selectedSection = ref('');
  const proposal = ref('');
  const reason = ref('');
  const isSubmitting = ref(false);
  const feedback = ref(null);
  const recaptchaContainer = ref(null);
  
  // Define props for component properties
  const props = defineProps({
    sections: {
      type: Array,
      required: true
    }
  });
  
  // Open modal and prevent page scrolling
  const openModal = () => {
    showModal.value = true;
    document.body.style.overflow = 'hidden';
  };
  
  // Close modal and reset form fields
  const closeModal = () => {
    showModal.value = false;
    document.body.style.overflow = '';
    resetForm();
  };
  
  // Reset all form fields to initial state
  const resetForm = () => {
    nome.value = '';
    cognome.value = '';
    email.value = '';
    titoloStudio.value = '';
    affiliazione.value = '';
    selectedSection.value = '';
    proposal.value = '';
    reason.value = '';
    feedback.value = null;
  };
  
  // Handle Escape key to close modal
  const handleEscKey = (event) => {
    if (event.key === 'Escape' && showModal.value) {
      closeModal();
    }
  };
  
  onMounted(() => {
    document.addEventListener('keydown', handleEscKey);
  });
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscKey);
  });
  
  // Submit proposal form data
  const submitProposal = async () => {
    isSubmitting.value = true;
    feedback.value = null;
  
    try {
      // Execute reCAPTCHA and send form data to server
      const recaptchaToken = await $recaptcha.execute('submit');
  
      const response = await fetch('/api/sendProposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postUrl: route.fullPath,
          nome: nome.value,
          cognome: cognome.value,
          email: email.value,
          titoloStudio: titoloStudio.value,
          affiliazione: affiliazione.value,
          section: selectedSection.value,
          proposal: proposal.value,
          reason: reason.value,
          recaptchaToken
        })
      });
  
      const result = await response.json();
  
      if (response.ok) {
        feedback.value = { type: 'success', message: 'La tua proposta è stata inviata con successo!' };
        setTimeout(closeModal, 3000);
      } else {
        throw new Error(result.message || "Si è verificato un errore durante l'invio della proposta.");
      }
    } catch (error) {
      console.error("Errore nell'invio della proposta:", error);
      feedback.value = { type: 'error', message: error.message };
    } finally {
      isSubmitting.value = false;
    }
  };
  </script>
  
  <style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  </style>