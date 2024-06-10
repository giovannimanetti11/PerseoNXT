<template>
  <div class="menu-container w-full bg-white p-6 rounded-bl-2xl rounded-br-2xl transition-all duration-500 ease-out">
    <div class="container mx-auto px-4">
      <div class="flex">
        <!-- Left col -->
        <div class="w-1/3">
          <p class="text-gray-700 text-lg">
            Amplia le tue conoscenze erboristiche, iscriviti alla <span class="text-blu">mailing list</span> di Wikiherbalist
          </p>
        </div>

        <!-- Right col -->
        <div class="w-2/3 flex flex-col justify-end items-center p-2">
          <div class="w-2/3 h-14 flex items-center border border-celeste rounded-2xl overflow-hidden py-2 px-4 focus-within:ring focus-within:ring-blu" ref="inputContainer">
            <input
              type="email"
              v-model="email"
              placeholder="La tua email"
              class="flex-grow focus:outline-none"
              @focus="handleFocus"
              @blur="handleBlur"
            />
            <button v-if="email" @click="subscribe" :class="buttonClass" class="ml-2 mr-2 text-sm text-white px-4 pb-0.5 rounded">Iscriviti</button>
            <Icon :name="iconName" :class="['text-5xl pr-4', iconClass]" ref="icon" />
          </div>
          <div v-if="message" :class="messageClass" class="mt-2 text-sm">{{ message }}</div>
          <div class="w-2/3 text-gray-400 text-xs mt-2">
            <p>Iscrivendoti, accetti i nostri Termini di servizio e la nostra privacy policy. 
              Wikiherbalist è protetto da reCAPTCHA, per il quale si applicano la <a href="https://policies.google.com/privacy" class="text-celeste hover:text-blu" target="_blank">privacy policy</a> e i <a href="https://policies.google.com/terms" class="text-celeste hover:text-blu" target="_blank">Termini di servizio</a> di Google.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const email = ref('');
const message = ref('');
const messageClass = ref('');
const iconClass = ref('text-celeste');
const iconName = ref('tabler:mail-filled');
const buttonClass = ref('bg-celeste');

const inputContainer = ref(null);

const handleFocus = () => {
  inputContainer.value.classList.add('ring', 'ring-blu');
  iconClass.value = 'text-blu';
  buttonClass.value = 'bg-blu';
};

const handleBlur = () => {
  inputContainer.value.classList.remove('ring', 'ring-blu');
  iconClass.value = 'text-celeste';
  buttonClass.value = 'bg-celeste';
};

const subscribe = async () => {
  console.log('Tentativo di iscrizione con email:', email.value);
  const { data, error } = await useFetch('/api/mailchimp', {
    method: 'POST',
    body: JSON.stringify({ email: email.value }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (error.value) {
    console.log('Errore durante l\'iscrizione:', error.value);
    message.value = 'Errore durante l\'iscrizione.';
    messageClass.value = 'text-red-500';
  } else {
    console.log('Risposta dal server:', data.value);
    message.value = 'Iscrizione avvenuta con successo!';
    messageClass.value = 'text-verde';
  }
};
</script>

<style scoped>
.menu-container {
  transition: all 0.4s ease-out;
}

input:focus + .iconClass {
  color: #036297;
}


</style>