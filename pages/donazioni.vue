<template>
  <div class="container mx-auto px-4 py-8 mt-24">
    <h1 class="text-5xl font-bold text-center text-black mb-10 mt-12 py-4">Fai una donazione</h1>
    <ClientOnly>
      <SimpleDonation :faqs="customFaqs" />
    </ClientOnly>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

// Import the SimpleDonation component asynchronously
const SimpleDonation = defineAsyncComponent(() => 
  import('~/modules/simple-donation/runtime/components/simpleDonation.vue')
)

// Custom FAQs
const customFaqs = [
  {
    question: 'Come vengono utilizzate le donazioni?',
    answer: 'Le donazioni vengono utilizzate per supportare lo sviluppo e la manutenzione di Wikiherbalist.'
  },
  {
    question: 'Questo sistema è sicuro?',
    answer: 'Sì, tutte le transazioni utilizzano sistemi con elevati livelli di sicurezza',
  },
  {
    question: 'Posso fare una donazione ricorrente?',
    answer: 'Al momento supportiamo solo donazioni una tantum, ma stiamo lavorando per implementare donazioni ricorrenti in futuro.',
  }
]

useHead({
  title: 'Donazioni',
  meta: [
    { name: 'description', content: 'Sostieni Wikiherbalist con una donazione. Contribuisci allo sviluppo e alla manutenzione di questa enciclopedia online dedicata alle erbe medicinali e aromatiche.' }
  ]
})
</script>


