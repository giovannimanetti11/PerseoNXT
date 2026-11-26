<template>
  <nav :aria-labelledby="titleId" class="lg:sticky lg:top-28 min-w-0 print:hidden">
    <details ref="panel" class="detail-gradient rounded-2xl p-4 lg:p-5 group lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto" :open="openOnLoad">
      <summary class="flex items-center justify-between cursor-pointer list-none font-bold text-lg">
        <span :id="titleId" class="flex items-center gap-2">
          <Icon name="ic:twotone-list" class="text-2xl text-black" aria-hidden="true" />
          Indice
        </span>
        <span class="text-sm font-normal text-gray-500 group-open:hidden">{{ headings.length }} sezioni</span>
      </summary>
      <ol class="mt-4 grid gap-1">
        <li v-for="(heading, index) in headings" :key="heading">
          <a
            :href="`#section${index + 1}`"
            :aria-current="active === index + 1 ? 'true' : undefined"
            :class="['group/item flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors duration-300', active === index + 1 ? 'bg-verde text-white' : 'hover:bg-white']"
            @click="onNavigate(index + 1)"
          >
            <span :class="['shrink-0 grid place-items-center w-6 h-6 rounded-full text-xs font-bold', active === index + 1 ? 'bg-white text-verde' : 'bg-verde text-white']">{{ index + 1 }}</span>
            <span class="min-w-0">{{ heading }}</span>
          </a>
        </li>
      </ol>
    </details>
  </nav>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { requestSectionOpen } from '~/utils/sections'

const props = defineProps<{ headings: string[] }>()

const titleId = useId()
const isWide = useMediaQuery('(min-width: 1024px)')
const panel = ref<HTMLDetailsElement | null>(null)
// Closed in the server render (no viewport there), opened after mount on desktop: avoids a hydration mismatch.
const openOnLoad = ref(false)
const active = ref(0)
let observer: IntersectionObserver | null = null

/** On phones the index closes after a jump, so the section is not hidden behind it, and the section opens. */
function onNavigate(number: number) {
  requestSectionOpen(`section${number}`)
  if (!isWide.value && panel.value) panel.value.open = false
}

function observe() {
  observer?.disconnect()
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) active.value = Number(entry.target.id.replace('section', '')) || 0
    }
  }, { rootMargin: '-30% 0px -60% 0px' })
  props.headings.forEach((_, index) => {
    const element = document.getElementById(`section${index + 1}`)
    if (element) observer?.observe(element)
  })
}

onMounted(() => {
  openOnLoad.value = isWide.value
  nextTick(observe)
})
watch(() => props.headings.join('|'), () => nextTick(observe))
onBeforeUnmount(() => observer?.disconnect())
</script>
