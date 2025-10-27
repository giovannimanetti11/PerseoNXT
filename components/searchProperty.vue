<template>
  <div class="flex flex-col relative w-11/12 m-auto -my-4">
    <div 
      :class="[
        'w-4/5 md:w-3/5 m-auto bg-white overflow-hidden rounded-2xl border-2',
        isFocused ? 'border-blu' : 'border-celeste'
      ]"
    >
      <div class="h-12 md:h-14 flex items-center">
        <Icon name="heroicons:magnifying-glass-16-solid" class="ml-5 text-celeste text-2xl" />
        <input
          type="search"
          placeholder="Cerca una proprietà terapeutica"
          class="w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none"
          v-model="searchTerm"
          @input="handleInput"
          @focus="isFocused = true"
          @blur="isFocused = false"
        />
        <div v-if="searchTerm" @click="resetSearch" class="ml-2 hover:cursor-pointer">
          <Icon name="ic:baseline-close" class="text-2xl text-celeste mr-4" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

const searchTerm = ref('');
const isFocused = ref(false);

const emit = defineEmits(['search']);

const handleInput = useDebounceFn(() => {
  emit('search', searchTerm.value);
}, 300);

const resetSearch = () => {
  searchTerm.value = '';
  emit('search', '');
};

onMounted(() => {
  emit('search', searchTerm.value);
});
</script>