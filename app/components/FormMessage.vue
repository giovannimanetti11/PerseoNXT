<template>
  <p
    v-if="message"
    :class="['p-3 text-sm rounded-lg', success ? 'text-green-800 bg-green-50' : 'text-red-800 bg-red-50']"
    :role="success ? 'status' : 'alert'"
  >
    {{ message }}
  </p>
</template>

<script setup lang="ts">
defineProps<{ message: string; success: boolean }>()
</script>
