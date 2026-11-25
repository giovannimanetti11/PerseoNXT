<template>
  <div class="relative w-11/12 m-auto -my-4">
    <div class="w-4/5 md:w-3/5 m-auto bg-white overflow-hidden rounded-2xl border-2 border-celeste focus-within:border-blu">
      <div class="h-12 md:h-14 flex items-center">
        <Icon name="heroicons:magnifying-glass-16-solid" class="ml-5 text-celeste text-2xl" />
        <label for="property-search" class="sr-only">Cerca una proprietà terapeutica</label>
        <input
          id="property-search"
          v-model="term"
          type="search"
          placeholder="Cerca una proprietà terapeutica"
          class="w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none"
        >
        <button v-if="term" type="button" class="mr-4" aria-label="Cancella la ricerca" @click="term = ''">
          <Icon name="ic:baseline-close" class="text-2xl text-celeste" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { refDebounced } from '@vueuse/core'

const model = defineModel<string>({ default: '' })
const term = ref(model.value)
const debounced = refDebounced(term, 300)

watch(debounced, (value) => { model.value = value })
</script>
