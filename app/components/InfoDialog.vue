<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        :class="['fixed inset-0 z-[60] flex justify-center items-center p-4', tooltip ? '' : 'bg-black/50']"
        @click.self="emit('close')"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :class="['relative bg-white rounded-lg shadow-xl p-6 w-full max-w-[600px] max-h-[85vh] overflow-y-auto text-sm text-gray-700', { 'border border-blu': tooltip }]"
        >
          <button type="button" class="absolute top-2 right-2 text-blu hover:text-celeste" aria-label="Chiudi" @click="emit('close')">
            <Icon name="mdi:close" class="text-2xl" />
          </button>
          <div class="flex items-center mb-4 pr-8">
            <Icon v-if="icon" :name="icon" class="text-2xl text-black mr-2" />
            <h2 :id="titleId" class="text-2xl font-bold text-blu">{{ title }}</h2>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

const props = defineProps<{
  open: boolean
  title: string
  icon?: string
  /** Definition popup: no dark backdrop, blue border (as the old tag tooltips). */
  tooltip?: boolean
}>()
const emit = defineEmits<{ close: [] }>()
const titleId = useId()

onKeyStroke('Escape', () => {
  if (props.open) emit('close')
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
