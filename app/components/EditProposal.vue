<template>
  <div class="print:hidden">
    <button
      type="button"
      class="fixed bottom-36 right-6 bg-verde hover:bg-celeste text-white rounded-full p-2 w-12 h-12 shadow-lg transition-colors duration-300 z-50 flex items-center justify-center"
      aria-label="Proponi una modifica a questa pagina"
      @click="open = true"
    >
      <Icon name="mdi:pencil" class="w-6 h-6" />
    </button>

    <InfoDialog :open="open" title="Proponi una modifica" icon="mdi:pencil" @close="close">
      <FormMessage class="mb-4" :message="result.message" :success="result.success" />

      <form v-if="!result.success" class="space-y-4 text-base text-black" @submit.prevent="onSubmit">
        <div class="flex gap-4">
          <label class="w-1/2">
            <span class="block mb-1">Nome</span>
            <input v-model.trim="form.nome" type="text" autocomplete="given-name" class="w-full border rounded p-2" required maxlength="100">
          </label>
          <label class="w-1/2">
            <span class="block mb-1">Cognome</span>
            <input v-model.trim="form.cognome" type="text" autocomplete="family-name" class="w-full border rounded p-2" required maxlength="100">
          </label>
        </div>
        <label class="block">
          <span class="block mb-1">Email</span>
          <input v-model.trim="form.email" type="email" autocomplete="email" class="w-full border rounded p-2" required>
        </label>
        <label class="block">
          <span class="block mb-1">Titolo di studio <span class="text-gray-500">(facoltativo)</span></span>
          <input v-model.trim="form.titoloStudio" type="text" class="w-full border rounded p-2" placeholder="Es. laurea in Biologia" maxlength="200">
        </label>
        <label class="block">
          <span class="block mb-1">Affiliazione <span class="text-gray-500">(facoltativo)</span></span>
          <input v-model.trim="form.affiliazione" type="text" class="w-full border rounded p-2" placeholder="Es. Università di Bologna" maxlength="200">
        </label>
        <label class="block">
          <span class="block mb-1">Sezione da modificare</span>
          <select v-model="form.section" class="w-full border rounded p-2" required>
            <option value="" disabled>Seleziona una sezione</option>
            <option v-for="section in sections" :key="section" :value="section">{{ section }}</option>
            <option value="Altro">Altro</option>
          </select>
        </label>
        <label class="block">
          <span class="block mb-1">La tua proposta</span>
          <textarea v-model="form.proposal" rows="6" class="w-full border rounded p-2" required maxlength="5000"></textarea>
        </label>
        <label class="block">
          <span class="block mb-1">Perché la proponi</span>
          <textarea v-model="form.reason" rows="3" class="w-full border rounded p-2" placeholder="Per esempio la fonte che la sostiene" required maxlength="2000"></textarea>
        </label>
        <div class="flex justify-end gap-2">
          <button type="button" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" @click="close">Annulla</button>
          <button type="submit" class="px-4 py-2 bg-blu text-white rounded hover:bg-celeste disabled:opacity-60" :disabled="pending">
            {{ pending ? 'Invio in corso…' : 'Invia proposta' }}
          </button>
        </div>
      </form>

      <div v-else class="flex justify-end mt-4">
        <button type="button" class="px-4 py-2 bg-blu text-white rounded hover:bg-celeste" @click="close">Chiudi</button>
      </div>
    </InfoDialog>
  </div>
</template>

<script setup lang="ts">
defineProps<{ sections: string[] }>()

const route = useRoute()
const open = ref(false)
const empty = () => ({ nome: '', cognome: '', email: '', titoloStudio: '', affiliazione: '', section: '', proposal: '', reason: '' })
const form = reactive(empty())
const result = reactive({ message: '', success: false })
const { submit, pending } = useRecaptchaSubmit('/api/sendProposal')

const onSubmit = async () => {
  Object.assign(result, await submit({ ...form, postUrl: route.path }))
}

function close() {
  open.value = false
  if (result.success) Object.assign(form, empty())
  Object.assign(result, { message: '', success: false })
}

watch(open, (value) => {
  document.body.style.overflow = value ? 'hidden' : ''
})
onBeforeUnmount(() => { document.body.style.overflow = '' })
</script>
