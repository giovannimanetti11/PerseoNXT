<template>
    <div class="bg-white py-8 px-4 rounded-xl shadow">
        <div class="flex space-x-4">
            <div class="flex flex-col w-1/2 space-y-4">
                <input type="text" v-model="form.nome" placeholder="Nome" class="placeholder-gray-300 border p-2 rounded-xl border-celeste focus:outline-none focus:ring-1 focus:ring-celeste">
                <input type="text" v-model="form.cognome" placeholder="Cognome" class="placeholder-gray-300 border p-2 rounded-xl border-celeste focus:outline-none focus:ring-1 focus:ring-celeste">
                <input type="email" v-model="form.email" placeholder="Mail" class="placeholder-gray-300 border p-2 rounded-xl border-celeste focus:outline-none focus:ring-1 focus:ring-celeste">
                <input type="tel" v-model="form.telefono" placeholder="Telefono" class="placeholder-gray-300 border p-2 rounded-xl border-celeste focus:outline-none focus:ring-1 focus:ring-celeste">
            </div>
            <div class="w-1/2">
                <textarea v-model="form.richiesta" placeholder="La tua richiesta" class="placeholder-gray-300 border p-2 rounded-xl border-celeste w-full min-h-full focus:outline-none focus:ring-1 focus:ring-celeste"></textarea>
            </div>
        </div>
        <div class="w-full text-center">
            <button @click="sendEmail" class="bg-verde border text-white w-1/2 rounded-xl py-4 mt-4 mb-4 hover:border-verde hover:border hover:text-verde hover:bg-white">
            Invia Richiesta
            </button>
        </div>
    </div>
</template>
  
<script setup>
import emailjs from 'emailjs-com';
import { apiConfig } from '../config';
  
const form = reactive({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    richiesta: ''
});

const sendEmail = () => {
const templateParams = {
    from_name: form.email,
    to_name: 'info@wikiherbalist.com',
    message: `Nome: ${form.nome}, Cognome: ${form.cognome}, Telefono: ${form.telefono}, Richiesta: ${form.richiesta}`
};

emailjs.send(apiConfig.emailJsServiceId, apiConfig.emailJsTemplateId, templateParams, apiConfig.emailJsUserId)
    .then((response) => {
        console.log('SUCCESS!', response.status, response.text);
    }, (error) => {
        console.log('FAILED...', error);
    });
}
</script>

<style scoped>
</style>
  