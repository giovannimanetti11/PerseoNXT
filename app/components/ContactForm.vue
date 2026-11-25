<template>
  <form class="bg-white py-8 px-4 rounded-xl" @submit.prevent="onSubmit">
    <FormMessage class="p-4 mb-4" :message="result.message" :success="result.success" />
    <div class="flex flex-col md:flex-row md:space-x-4">
      <div class="flex flex-col w-full md:w-1/2 space-y-4">
        <input v-model.trim="form.nome" type="text" autocomplete="given-name" placeholder="Nome" aria-label="Nome" maxlength="100" :class="inputClass">
        <input v-model.trim="form.cognome" type="text" autocomplete="family-name" placeholder="Cognome" aria-label="Cognome" maxlength="100" :class="inputClass">
        <input v-model.trim="form.email" type="email" autocomplete="email" placeholder="Email" aria-label="Email" :class="inputClass" required>
        <input v-model.trim="form.telefono" type="tel" autocomplete="tel" placeholder="Telefono" aria-label="Telefono" maxlength="40" :class="inputClass">
      </div>
      <div class="w-full md:w-1/2 mt-4 md:mt-0">
        <textarea
          v-model="form.richiesta"
          placeholder="La tua richiesta"
          aria-label="La tua richiesta"
          :class="[inputClass, 'h-64 md:h-full resize-none']"
          maxlength="5000"
          required
        ></textarea>
      </div>
    </div>
    <!-- Honeypot: hidden to people, filled in by naive bots -->
    <input v-model="honeypot" type="text" name="website" class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="w-full text-center">
      <button
        type="submit"
        :disabled="pending"
        class="bg-verde border text-white w-full md:w-1/2 rounded-xl py-4 mt-8 mb-4 hover:border-verde hover:text-verde hover:bg-white disabled:opacity-60"
      >
        {{ pending ? 'Invio in corso…' : 'Invia Richiesta' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
const inputClass = 'w-full placeholder-gray-300 border p-2 rounded-xl border-celeste focus:outline-none focus:ring-1 focus:ring-celeste'

const empty = () => ({ nome: '', cognome: '', email: '', telefono: '', richiesta: '' })
const form = reactive(empty())
const honeypot = ref('')
const result = reactive({ message: '', success: false })
const { submit, pending } = useRecaptchaSubmit('/api/sendEmail')

const onSubmit = async () => {
  if (honeypot.value) return
  Object.assign(result, await submit({ ...form }))
  if (result.success) Object.assign(form, empty())
}
</script>
