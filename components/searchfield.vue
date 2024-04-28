<template>
    <div class="relative w-full">
      <div class="rounded-2xl h-14 bg-white flex items-center border border-sky-500 overflow-hidden">
        <Icon name="heroicons:magnifying-glass-16-solid" class="ml-5 text-sky-500 text-2xl" />
        <input
          type="search"
          placeholder="Cerca in Wikiherbalist"
          class="w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none"
        />
      </div>
    </div>
</template>




<script setup>
  import { Icon } from '#components'
</script>

<style scoped>
</style>