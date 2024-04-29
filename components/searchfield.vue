<template>
    <div class="relative w-11/12 m-auto -my-4">
      <div class="rounded-2xl w-3/5 m-auto h-14 bg-white flex items-center border border-celeste overflow-hidden">
        <Icon name="heroicons:magnifying-glass-16-solid" class="ml-5 text-celeste text-2xl" />
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