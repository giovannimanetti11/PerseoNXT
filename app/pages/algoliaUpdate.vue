<template>
  <div class="min-h-screen bg-gray-100 py-12 mt-20">
    <div class="max-w-3xl mx-auto px-4">
      <h1 class="text-3xl font-bold mb-2">Indice di ricerca</h1>
      <p class="text-gray-600 mb-8">
        Confronta WordPress con l'indice Algolia e aggiorna i record di un tipo di contenuto.
        I record sono costruiti dal server con lo slug come objectID.
      </p>

      <form class="bg-white rounded-lg shadow-md p-6 space-y-4" @submit.prevent="checkStatus">
        <label class="block">
          <span class="block text-sm font-medium text-gray-700 mb-1">Password</span>
          <input v-model="password" type="password" autocomplete="current-password" class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blu focus:outline-none" required>
        </label>

        <fieldset>
          <legend class="block text-sm font-medium text-gray-700 mb-1">Contenuto</legend>
          <div class="flex gap-2">
            <label v-for="option in TYPES" :key="option.value" class="flex-1">
              <input v-model="type" type="radio" name="type" :value="option.value" class="peer sr-only">
              <span class="block text-center py-2 rounded-md border cursor-pointer peer-checked:bg-blu peer-checked:text-white peer-checked:border-blu">
                {{ option.label }}
              </span>
            </label>
          </div>
        </fieldset>

        <button type="submit" class="w-full bg-blu text-white py-2 rounded-md hover:bg-celeste disabled:opacity-60" :disabled="busy">
          {{ busy && !status ? 'Controllo in corso…' : 'Controlla' }}
        </button>
      </form>

      <p v-if="message" :class="['mt-6 p-4 rounded-md', failed ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800']" role="status">
        {{ message }}
      </p>

      <section v-if="status" class="bg-white rounded-lg shadow-md p-6 mt-6 space-y-4">
        <dl class="grid grid-cols-2 gap-4 text-center">
          <div class="bg-gray-50 rounded p-4">
            <dt class="text-sm text-gray-600">WordPress</dt>
            <dd class="text-3xl font-bold">{{ status.wordpress }}</dd>
          </div>
          <div class="bg-gray-50 rounded p-4">
            <dt class="text-sm text-gray-600">Algolia</dt>
            <dd class="text-3xl font-bold">{{ status.algolia }}</dd>
          </div>
        </dl>

        <div v-if="status.missing.length">
          <h2 class="font-semibold">Da aggiungere ({{ status.missing.length }})</h2>
          <p class="text-sm text-gray-700 break-words">{{ status.missing.join(', ') }}</p>
        </div>
        <div v-if="status.orphaned.length">
          <h2 class="font-semibold">Nell'indice ma non più in WordPress ({{ status.orphaned.length }})</h2>
          <p class="text-sm text-gray-700 break-words">{{ status.orphaned.join(', ') }}</p>
          <label class="flex items-center gap-2 mt-2 text-sm">
            <input v-model="removeOrphans" type="checkbox">
            Elimina questi record durante l'aggiornamento
          </label>
        </div>
        <p v-if="!status.missing.length && !status.orphaned.length" class="text-sm text-gray-700">
          Indice allineato. L'aggiornamento serve solo se sono cambiati titoli o immagini.
        </p>

        <button type="button" class="w-full bg-verde text-white py-3 rounded-md hover:bg-celeste disabled:opacity-60" :disabled="busy" @click="sync">
          {{ busy ? 'Aggiornamento in corso…' : `Aggiorna ${status.wordpress} record` }}
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ContentType } from '#shared/types/content'
import type { SyncResult, SyncStatus } from '#shared/types/api'

definePageMeta({ ssr: false })
useSeoMeta({ title: 'Indice di ricerca', robots: 'noindex, nofollow' })

const TYPES: { value: ContentType; label: string }[] = [
  { value: 'plant', label: 'Piante' },
  { value: 'glossary', label: 'Glossario' },
  { value: 'blog', label: 'Blog' },
]

const route = useRoute()
const initialType = TYPES.find((option) => option.value === route.query.type)?.value ?? 'plant'

const password = ref('')
const type = ref<ContentType>(initialType)
const status = ref<SyncStatus | null>(null)
const removeOrphans = ref(false)
const busy = ref(false)
const message = ref('')
const failed = ref(false)

watch(type, () => {
  status.value = null
  message.value = ''
})

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'statusMessage' in error && typeof error.statusMessage === 'string') {
    return error.statusMessage
  }
  return 'Richiesta non riuscita'
}

async function run<T>(endpoint: string, body: Record<string, unknown>): Promise<T | null> {
  busy.value = true
  message.value = ''
  try {
    return await $fetch<T>(endpoint, { method: 'POST', body: { password: password.value, type: type.value, ...body } })
  } catch (error) {
    failed.value = true
    message.value = errorMessage(error)
    return null
  } finally {
    busy.value = false
  }
}

async function checkStatus() {
  status.value = await run<SyncStatus>('/api/algolia/status', {})
  removeOrphans.value = false
}

async function sync() {
  const result = await run<SyncResult>('/api/algolia/sync', { removeOrphans: removeOrphans.value })
  if (!result) return
  await checkStatus()
  failed.value = false
  message.value = `Aggiornati ${result.updated} record${result.deleted ? `, eliminati ${result.deleted}` : ''}.`
}
</script>
