<template>
  <div class="flex justify-center items-center w-full" :class="height" role="status">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blu"></div>
    <span class="sr-only">Caricamento in corso</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ height?: string }>(), { height: 'h-64' })
</script>
