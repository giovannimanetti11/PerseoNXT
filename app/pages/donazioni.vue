<template>
  <div class="mx-auto px-4 py-8 mt-24">
    <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Fai una donazione</h1>
    <SimpleDonation lang="it" :faqs="faqs" />
  </div>
</template>

<script setup lang="ts">
const faqs = [
  {
    question: 'Come vengono usate le donazioni?',
    answer: 'Coprono i costi di hosting, sviluppo e manutenzione di Wikiherbalist.',
  },
  {
    question: 'Il pagamento è sicuro?',
    answer: 'Sì: il pagamento avviene su PayPal, Wikiherbalist non vede né conserva i dati della carta.',
  },
  {
    question: 'Posso fare una donazione ricorrente?',
    answer: 'Per ora solo donazioni una tantum.',
  },
]

useSeoMeta({
  title: 'Donazioni',
  description: "Sostieni Wikiherbalist con una donazione: copre hosting, sviluppo e manutenzione dell'enciclopedia online delle piante medicinali.",
})
</script>
