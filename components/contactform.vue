<template>
  <div class="bg-white py-8 px-4 rounded-xl">
    <div v-if="message.content" :class="message.type" class="p-4 mb-4 text-sm rounded-lg dark:bg-gray-800" role="alert">
      <span class="font-medium">{{ message.header }}</span> {{ message.content }}
    </div>
    <div class="flex flex-col md:flex-row md:space-x-4">
      <div class="flex flex-col w-full md:w-1/2 space-y-4">
        <input type="text" v-model="form.nome" placeholder="Nome" class="w-full placeholder-gray-300 border p-2 rounded-xl border-celeste focus:outline-none focus:ring-1 focus:ring-celeste">
        <input type="text" v-model="form.cognome" placeholder="Cognome" class="w-full placeholder-gray-300 border p-2 rounded-xl border-celeste focus:outline-none focus:ring-1 focus:ring-celeste">
        <input type="email" v-model="form.email" placeholder="Mail" class="w-full placeholder-gray-300 border p-2 rounded-xl border-celeste focus:outline-none focus:ring-1 focus:ring-celeste" :class="{'input-error': v$.email.$error}" required>
        <div v-if="v$.email.$error" class="text-red-500 text-sm">Inserisci un indirizzo email valido</div>
        <input type="tel" v-model="form.telefono" placeholder="Telefono" class="w-full placeholder-gray-300 border p-2 rounded-xl border-celeste focus:outline-none focus:ring-1 focus:ring-celeste">
      </div>
      <div class="w-full md:w-1/2 mt-4 md:mt-0">
        <textarea 
          v-model="form.richiesta" 
          placeholder="La tua richiesta" 
          class="w-full h-64 md:h-full placeholder-gray-300 border p-2 rounded-xl border-celeste focus:outline-none focus:ring-1 focus:ring-celeste resize-none" 
          :class="{'input-error': v$.richiesta.$error}" 
          required
        ></textarea>
        <div v-if="v$.richiesta.$error" class="text-red-500 text-sm">Scrivi un messaggio</div>
      </div>
    </div>
    <input type="text" v-model="form.honeypot" class="hidden" autocomplete="off">
    <div class="w-full text-center">
      <button @click="sendEmail" class="bg-verde border text-white w-full md:w-1/2 rounded-xl py-4 mt-8 mb-4 hover:border-verde hover:border hover:text-verde hover:bg-white">
        Invia Richiesta
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import useVuelidate from '@vuelidate/core';
import { required, email } from '@vuelidate/validators';
import { useNuxtApp } from '#app';

const { $recaptcha } = useNuxtApp();

const form = reactive({
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  richiesta: '',
  honeypot: '',
  recaptchaToken: ''
});

const rules = {
  email: { required, email },
  richiesta: { required }
};

const v$ = useVuelidate(rules, form);

const message = reactive({
  header: '',
  content: '',
  type: ''
});

const sendEmail = async () => {
  if (form.honeypot) return;
  v$.value.$validate();
  if (!v$.value.$error) {
    try {
      form.recaptchaToken = await $recaptcha.execute('submit');
      console.log('Recaptcha token:', form.recaptchaToken);

      const response = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none';"
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`La risposta del server non è OK: ${errorDetails}`);
      }

      const data = await response.json();
      if (data.success) {
        message.header = 'Inviato!';
        message.content = data.message;
        message.type = 'text-green-800 bg-green-50 dark:text-green-400';
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error sending email', error);
      message.header = 'Errore!';
      message.content = 'Si è verificato un errore nell\'invio della richiesta: ' + error.message;
      message.type = 'text-red-800 bg-red-50 dark:text-red-400';
    }
  } else {
    if (v$.value.email.$error) {
      message.header = 'Errore!';
      message.content = 'Inserisci un indirizzo email valido.';
      message.type = 'text-red-800 bg-red-50 dark:text-red-400';
    } else if (v$.value.richiesta.$error) {
      message.header = 'Errore!';
      message.content = 'Scrivi un messaggio.';
      message.type = 'text-red-800 bg-red-50 dark:text-red-400';
    }
  }
};
</script>

<style scoped>
.input-error {
  border-color: red;
}
</style>
