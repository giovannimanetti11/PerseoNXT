<template>
  <nav aria-label="Breadcrumb" class="text-sm">
    <ol class="list-none p-0 inline-flex flex-wrap">
      <li class="flex items-center">
        <NuxtLink to="/" class="text-blu hover:text-celeste transition-colors duration-300">Home</NuxtLink>
        <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400 mx-2" />
      </li>
      <li v-if="parentPath && parentName" class="flex items-center">
        <NuxtLink :to="parentPath" class="text-blu hover:text-celeste transition-colors duration-300">{{ parentName }}</NuxtLink>
        <Icon name="heroicons:chevron-right" class="w-5 h-5 text-gray-400 mx-2" />
      </li>
      <li class="flex items-center">
        <span class="text-gray-500" aria-current="page">{{ currentPageName }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  currentPageName: string
  parentPath?: string
  parentName?: string
}>(), { parentPath: '', parentName: '' })
</script>
