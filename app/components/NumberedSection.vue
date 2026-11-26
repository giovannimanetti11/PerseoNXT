<template>
  <section
    :id="sectionId"
    :class="[
      'content-section section-gradient flex flex-col px-4 md:px-10 mx-auto rounded-2xl mt-4 scroll-mt-28 print:py-2 print:px-0',
      collapsible ? (open ? 'py-6 md:py-20' : 'py-4 md:py-20') : 'py-10 md:py-20',
      extraClass,
    ]"
  >
    <!-- Collapsible (monographs on phones): number and title open the section; on desktop it is always open. -->
    <h2 v-if="heading && collapsible" class="text-xl md:text-2xl">
      <button
        type="button"
        class="flex items-center gap-4 w-full text-left md:cursor-text"
        :aria-expanded="open"
        :aria-controls="bodyId"
        @click="toggle"
      >
        <span
          v-if="number && !hideNumber"
          class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold"
          aria-hidden="true"
        >
          {{ number }}
        </span>
        <span class="min-w-0 flex-1">{{ heading }}</span>
        <Icon
          name="ic:round-keyboard-arrow-down"
          :class="['md:hidden shrink-0 text-2xl text-blu transition-transform duration-300', open ? 'rotate-180' : '']"
          aria-hidden="true"
        />
      </button>
    </h2>
    <div v-else-if="heading" class="flex items-center gap-4">
      <span
        v-if="number && !hideNumber"
        class="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-blu text-white rounded-full text-base md:text-lg font-bold"
        aria-hidden="true"
      >
        {{ number }}
      </span>
      <h2 class="text-xl md:text-2xl">{{ heading }}</h2>
    </div>

    <!-- The content stays in the HTML when closed (search engines, print, find in page on desktop). -->
    <div v-if="heading && collapsible" :id="bodyId" :class="['flex flex-col', open ? '' : 'hidden md:flex print:flex']">
      <slot />
    </div>
    <slot v-else />
  </section>
</template>

<script setup lang="ts">
import { SECTION_OPEN_EVENT, collapsibleSectionsKey } from '~/utils/sections'

const props = withDefaults(defineProps<{
  heading?: string
  /** Position in the table of contents; builds the #sectionN anchor. */
  number?: number
  hideNumber?: boolean
  extraClass?: string
}>(), { heading: '', number: 0, hideNumber: false, extraClass: 'w-11/12' })

/** Provided by pages that want accordion sections on phones (the monograph). */
const collapsible = inject(collapsibleSectionsKey, false)
const open = ref(false)
const bodyId = useId()
const sectionId = computed(() => (props.number ? `section${props.number}` : undefined))

function toggle() {
  open.value = !open.value
}

/** Opens the section when the index, a link or the URL points to it. */
function openIfTarget(id: string | null | undefined) {
  if (collapsible && id && sectionId.value && id === sectionId.value) open.value = true
}

const onHash = () => openIfTarget(decodeURIComponent(window.location.hash.slice(1)))
const onOpenRequest = (event: Event) => openIfTarget((event as CustomEvent<string>).detail)

onMounted(() => {
  if (!collapsible) return
  onHash()
  window.addEventListener('hashchange', onHash)
  window.addEventListener(SECTION_OPEN_EVENT, onOpenRequest)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', onHash)
  window.removeEventListener(SECTION_OPEN_EVENT, onOpenRequest)
})
</script>
