<template>
  <section class="py-10 w-11/12 mx-auto rounded-2xl bg-gradient-to-b from-[#e0edfd] to-[#f5f5f5]">
    <div class="mx-auto px-4">
      <div class="mb-6 flex justify-center">
        <div class="bg-white rounded-lg shadow-md p-1 inline-flex gap-1" role="tablist" aria-label="Modalità di consultazione">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            role="tab"
            :aria-selected="view === option.value"
            class="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blu"
            :class="view === option.value ? 'bg-blu text-white' : 'text-blu hover:bg-gray-100'"
            @click="view = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <h2 class="text-3xl md:text-4xl font-bold text-center text-black mb-6">
        <template v-if="view === 'monographs'">
          Sfoglia le <span class="text-blu">monografie</span> delle piante medicinali
        </template>
        <template v-else>
          Scopri le <span class="text-blu">proprietà terapeutiche</span> delle piante medicinali
        </template>
      </h2>

      <Suspense>
        <KeepAlive>
          <BrowseByLetter v-if="view === 'monographs'" />
          <TagsByLetter v-else :search-term="searchTerm" />
        </KeepAlive>
        <template #fallback>
          <LoadingSpinner />
        </template>
      </Suspense>
    </div>
  </section>
</template>

<script setup lang="ts">
export type BrowseView = 'monographs' | 'properties'

defineProps<{ searchTerm: string }>()
const view = defineModel<BrowseView>('view', { required: true })

const options: { value: BrowseView; label: string }[] = [
  { value: 'monographs', label: 'Monografie' },
  { value: 'properties', label: 'Proprietà' },
]
</script>
