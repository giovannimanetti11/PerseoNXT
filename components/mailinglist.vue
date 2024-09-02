<template>
  <div class="menu-container w-full bg-white p-6 rounded-bl-2xl rounded-br-2xl transition-all duration-500 ease-out">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row">
        <!-- Left col -->
        <div class="w-full md:w-1/3 mb-4 md:mb-0">
          <p class="text-gray-700 text-lg">
            Amplia le tue conoscenze erboristiche, iscriviti alla <span class="text-blu">mailing list</span> di Wikiherbalist
          </p>
        </div>
        <!-- Right col -->
        <div class="w-full md:w-2/3 flex flex-col items-center">
          <form @submit.prevent="handleSubmit" class="w-full md:w-2/3">
            <div class="flex flex-col">
              <div class="relative mb-2">
                <input
                  type="email"
                  v-model="form.email"
                  placeholder="La tua email"
                  class="w-full h-14 border border-celeste rounded-2xl px-4 focus:outline-none focus:ring-1 focus:ring-blu"
                  @focus="expandForm"
                  required
                />
                <Icon name="tabler:mail-filled" class="absolute right-4 top-1/2 transform -translate-y-1/2 text-3xl text-celeste" />
              </div>
              <transition name="slide-fade">
                <div v-if="isExpanded" class="space-y-2">
                  <div class="flex space-x-2">
                    <input
                      type="text"
                      v-model="form.firstName"
                      placeholder="Nome"
                      class="w-1/2 h-14 border border-celeste rounded-2xl px-4 focus:outline-none focus:ring-1 focus:ring-blu"
                      required
                    />
                    <input
                      type="text"
                      v-model="form.lastName"
                      placeholder="Cognome"
                      class="w-1/2 h-14 border border-celeste rounded-2xl px-4 focus:outline-none focus:ring-1 focus:ring-blu"
                      required
                    />
                  </div>
                  <div class="flex justify-end">
                    <button 
                      type="submit" 
                      class="bg-celeste hover:bg-blu text-white font-bold py-2 px-6 rounded-2xl transition-colors duration-300"
                    >
                      Iscriviti
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </form>
          <div v-if="message" :class="messageClass" class="mt-2 text-sm w-full md:w-2/3 text-center">{{ message }}</div>
          <div class="w-full md:w-2/3 text-gray-400 text-xs mt-2">
            <p>Iscrivendoti, accetti i Termini di servizio e la <a href="https://www.wikiherbalist.com/privacy-policy" class="text-celeste hover:text-blu" target="_blank">privacy policy</a> di Wikiherbalist. 
              Wikiherbalist è protetto da reCAPTCHA, per il quale si applicano la <a href="https://policies.google.com/privacy" class="text-celeste hover:text-blu" target="_blank">privacy policy</a> e i <a href="https://policies.google.com/terms" class="text-celeste hover:text-blu" target="_blank">Termini di servizio</a> di Google.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, email, helpers } from '@vuelidate/validators';
import { useNuxtApp } from '#app';

const { $recaptcha } = useNuxtApp();

const form = reactive({
  email: '',
  firstName: '',
  lastName: ''
});

const message = ref('');
const messageClass = ref('');
const isExpanded = ref(false);

const rules = {
  email: { required, email },
  firstName: { required, alpha: helpers.regex(/^[A-Za-z\s]+$/) },
  lastName: { required, alpha: helpers.regex(/^[A-Za-z\s]+$/) }
};

const v$ = useVuelidate(rules, form);

const expandForm = () => {
  isExpanded.value = true;
};

const handleSubmit = async () => {
  const isValid = await v$.value.$validate();
  if (!isValid) {
    message.value = 'Per favore, compila correttamente tutti i campi.';
    messageClass.value = 'text-red-500';
    return;
  }

  try {
    console.log('Inizio processo di iscrizione/aggiornamento');
    
    // Execute reCAPTCHA
    const recaptchaToken = await $recaptcha.execute('submit');
    console.log('reCAPTCHA token ottenuto');

    const { data, error } = await useFetch('/api/mailchimp', {
      method: 'POST',
      body: { ...form, recaptchaToken },
    });

    console.log('Risposta dal server:', data.value, error.value);

    if (error.value) {
      throw new Error(`Errore nella richiesta: ${error.value.message}`);
    }

    if (data.value && data.value.success) {
      message.value = data.value.message || 'Operazione completata con successo!';
      messageClass.value = 'text-verde';
      Object.keys(form).forEach(key => form[key] = '');
      isExpanded.value = false;
    } else if (data.value && data.value.status === 'updated') {
      message.value = 'Il tuo profilo è stato aggiornato con successo!';
      messageClass.value = 'text-blu';
      Object.keys(form).forEach(key => form[key] = '');
      isExpanded.value = false;
    } else {
      throw new Error(data.value?.message || 'Risposta del server non valida');
    }
  } catch (error) {
    console.error('Errore dettagliato:', error);
    message.value = `Si è verificato un errore: ${error.message}`;
    messageClass.value = 'text-red-500';
  }
};
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.menu-container {
  transition: all 0.4s ease-out;
}
</style>