<template>
  <div class="w-full bg-white p-6 rounded-b-2xl">
    <div class="mx-auto px-4 flex flex-col md:flex-row gap-4">
      <p class="w-full md:w-1/3 text-gray-700 text-lg">
        Iscriviti alla <span class="text-blu">mailing list</span> di Wikiherbalist per ricevere i nuovi articoli e le monografie aggiornate.
      </p>
      <div class="w-full md:w-2/3 flex flex-col items-center">
        <form class="w-full md:w-2/3 flex flex-col gap-2" @submit.prevent="onSubmit">
          <div class="relative">
            <label for="newsletter-email" class="sr-only">Email</label>
            <input
              id="newsletter-email"
              v-model.trim="form.email"
              type="email"
              autocomplete="email"
              placeholder="La tua email"
              class="w-full h-14 border border-celeste rounded-2xl px-4 focus:outline-none focus:ring-1 focus:ring-blu"
              required
              @focus="expanded = true"
            >
            <Icon name="tabler:mail-filled" class="absolute right-4 top-1/2 -translate-y-1/2 text-3xl text-celeste" />
          </div>
          <Transition name="slide-fade">
            <div v-if="expanded" class="space-y-2">
              <div class="flex gap-2">
                <label for="newsletter-first" class="sr-only">Nome</label>
                <input
                  id="newsletter-first"
                  v-model.trim="form.firstName"
                  type="text"
                  autocomplete="given-name"
                  placeholder="Nome"
                  maxlength="100"
                  class="w-1/2 h-14 border border-celeste rounded-2xl px-4 focus:outline-none focus:ring-1 focus:ring-blu"
                  required
                >
                <label for="newsletter-last" class="sr-only">Cognome</label>
                <input
                  id="newsletter-last"
                  v-model.trim="form.lastName"
                  type="text"
                  autocomplete="family-name"
                  placeholder="Cognome"
                  maxlength="100"
                  class="w-1/2 h-14 border border-celeste rounded-2xl px-4 focus:outline-none focus:ring-1 focus:ring-blu"
                  required
                >
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="pending"
                  class="bg-celeste hover:bg-blu text-white font-bold py-2 px-6 rounded-2xl transition-colors duration-300 disabled:opacity-60"
                >
                  {{ pending ? 'Invio…' : 'Iscriviti' }}
                </button>
              </div>
            </div>
          </Transition>
        </form>
        <FormMessage class="mt-2 w-full md:w-2/3 text-center" :message="result.message" :success="result.success" />
        <p class="w-full md:w-2/3 text-gray-400 text-xs mt-2">
          Iscrivendoti accetti la <NuxtLink to="/privacy-policy" class="text-celeste hover:text-blu">privacy policy</NuxtLink> di Wikiherbalist.
          Il modulo è protetto da reCAPTCHA: si applicano la <a href="https://policies.google.com/privacy" class="text-celeste hover:text-blu" target="_blank" rel="noopener">privacy policy</a>
          e i <a href="https://policies.google.com/terms" class="text-celeste hover:text-blu" target="_blank" rel="noopener">termini di servizio</a> di Google.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = reactive({ email: '', firstName: '', lastName: '' })
const expanded = ref(false)
const result = reactive({ message: '', success: false })
const { submit, pending } = useRecaptchaSubmit('/api/mailchimp')

const onSubmit = async () => {
  Object.assign(result, await submit({ ...form }))
  if (result.success) {
    Object.assign(form, { email: '', firstName: '', lastName: '' })
    expanded.value = false
  }
}
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
</style>
