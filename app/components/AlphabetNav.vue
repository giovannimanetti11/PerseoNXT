<template>
  <div class="w-full mx-auto flex justify-center mt-8 items-center">
    <button type="button" class="mr-2" aria-label="Scorri a sinistra" @click="scroll(-1)">
      <Icon name="iconamoon:arrow-left-2" class="text-5xl text-celeste hover:text-white hover:bg-verde hover:rounded-full hover:border-verde" />
    </button>

    <div ref="track" class="flex overflow-hidden scrollbar-hide" role="tablist" aria-label="Lettera iniziale">
      <button
        v-for="letter in LETTERS"
        :key="letter"
        type="button"
        role="tab"
        :aria-selected="letter === modelValue"
        :class="[
          size,
          'flex justify-center items-center rounded-full mx-1 whitespace-nowrap flex-shrink-0',
          letter === modelValue ? 'bg-celeste text-white' : 'text-black font-bold hover:bg-celeste hover:text-white',
        ]"
        @click="emit('update:modelValue', letter)"
      >
        {{ letter }}
      </button>
    </div>

    <button type="button" class="ml-2" aria-label="Scorri a destra" @click="scroll(1)">
      <Icon name="iconamoon:arrow-right-2" class="text-5xl text-celeste hover:text-white hover:bg-verde hover:border hover:rounded-full hover:border-verde" />
    </button>
  </div>
</template>

<script setup lang="ts">
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

withDefaults(defineProps<{
  modelValue: string
  /** Tailwind size classes of each letter button. */
  size?: string
}>(), { size: 'w-12 h-12' })
const emit = defineEmits<{ 'update:modelValue': [letter: string] }>()

const track = ref<HTMLElement | null>(null)
const scroll = (direction: 1 | -1) => {
  if (track.value) track.value.scrollLeft += direction * 100
}
</script>
