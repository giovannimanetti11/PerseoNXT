<template>
  <div class="w-full mx-auto flex justify-center mt-8 items-center">
    <button type="button" class="mr-2" aria-label="Lettere precedenti" @click="scroll(-1)">
      <Icon name="iconamoon:arrow-left-2" class="text-5xl text-celeste hover:text-white hover:bg-verde rounded-full" />
    </button>

    <div ref="track" class="flex overflow-hidden scrollbar-hide" role="tablist" aria-label="Lettera iniziale">
      <button
        v-for="letter in LETTERS"
        :key="letter"
        type="button"
        role="tab"
        :aria-selected="letter === modelValue"
        :disabled="available && !available.has(letter)"
        :class="[
          'w-10 h-10 md:w-12 md:h-12 mx-1 flex-shrink-0 flex justify-center items-center rounded-full font-bold',
          letter === modelValue ? 'bg-celeste text-white' : 'text-black hover:bg-celeste hover:text-white',
          'disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-default',
        ]"
        @click="emit('update:modelValue', letter)"
      >
        {{ letter }}
      </button>
    </div>

    <button type="button" class="ml-2" aria-label="Lettere successive" @click="scroll(1)">
      <Icon name="iconamoon:arrow-right-2" class="text-5xl text-celeste hover:text-white hover:bg-verde rounded-full" />
    </button>
  </div>
</template>

<script setup lang="ts">
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

defineProps<{
  modelValue: string
  /** Letters with at least one entry; the others are disabled. */
  available?: Set<string>
}>()
const emit = defineEmits<{ 'update:modelValue': [letter: string] }>()

const track = ref<HTMLElement | null>(null)
const scroll = (direction: 1 | -1) => track.value?.scrollBy({ left: direction * 150, behavior: 'smooth' })
</script>
