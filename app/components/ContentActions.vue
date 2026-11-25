<template>
  <div class="flex mt-4 gap-2 print:hidden">
    <button type="button" :class="buttonClass" class="hidden sm:flex" @click="print">
      <Icon name="mingcute:print-fill" class="text-lg md:text-xl" />
      <span class="ml-1 md:ml-2 text-base">Stampa</span>
    </button>
    <button type="button" :class="buttonClass" @click="openShare">
      <Icon name="ic:round-share" class="text-lg md:text-xl" />
      <span class="ml-1 md:ml-2 text-base">Condividi</span>
    </button>
    <button type="button" :class="buttonClass" @click="dialog = 'cite'">
      <Icon name="bi:quote" class="text-lg md:text-xl" />
      <span class="ml-1 md:ml-2 text-base">Cita</span>
    </button>

    <InfoDialog :open="dialog === 'share'" title="Condividi la pagina" icon="heroicons:share-20-solid" @close="dialog = null">
      <p class="font-semibold mb-4">Condividi sui social</p>
      <div class="flex gap-4 mb-4">
        <a
          v-for="network in networks"
          :key="network.name"
          :href="network.url(pageUrl)"
          target="_blank"
          rel="noopener noreferrer"
          :class="network.color"
          :aria-label="`Condividi su ${network.name}`"
        >
          <Icon :name="network.icon" class="w-8 h-8" />
        </a>
      </div>
      <p class="font-semibold mb-2">Link</p>
      <div class="flex items-center bg-gray-100 rounded p-2">
        <input :value="pageUrl" readonly aria-label="Link della pagina" class="bg-transparent flex-grow mr-2 focus:outline-none px-2 py-1">
        <button type="button" class="text-blu hover:text-celeste" aria-label="Copia il link" @click="copy(pageUrl)">
          <Icon name="heroicons:clipboard-document" class="w-6 h-6 text-black" />
        </button>
      </div>
      <p v-if="copied" class="text-green-600 mt-2 text-sm" role="status">Copiato negli appunti</p>
    </InfoDialog>

    <InfoDialog :open="dialog === 'cite'" title="Cita la pagina" icon="bi:quote" @close="dialog = null">
      <p class="text-sm text-gray-600 mb-4">
        Le citazioni seguono le regole di ciascuno stile, ma possono esserci piccole differenze: per un lavoro formale verifica sul manuale dello stile scelto.
      </p>
      <label for="citation-style" class="block text-sm font-medium text-gray-700 mb-2">Stile di citazione</label>
      <select id="citation-style" v-model="style" class="w-full border border-gray-300 rounded-md mb-4 px-3 py-2">
        <option v-for="option in CITATION_STYLES" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <div class="relative p-3 pr-10 bg-gray-100 rounded-md text-sm">
        <p>
          <span v-for="(part, index) in citation" :key="index" :class="{ italic: part.italic }">{{ part.text }}</span>
        </p>
        <button type="button" class="absolute top-3 right-3" aria-label="Copia la citazione" @click="copy(citationText(citation))">
          <Icon name="heroicons:clipboard-document" class="w-6 h-6 text-black" />
        </button>
      </div>
      <p v-if="copied" class="text-green-600 mt-2 text-sm" role="status">Copiato negli appunti</p>
    </InfoDialog>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { CitationStyle } from '~/utils/citation'

const props = defineProps<{ title: string; author: string; published: string }>()

const buttonClass = 'flex items-center py-2 px-3 md:px-4 bg-white shadow text-blu border rounded-lg hover:bg-blu hover:text-white transition duration-300'

const networks = [
  { name: 'Facebook', icon: 'mdi:facebook', color: 'text-blue-600 hover:text-blue-700', url: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { name: 'X', icon: 'simple-icons:x', color: 'text-black hover:text-gray-700', url: (u: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}` },
  { name: 'LinkedIn', icon: 'mdi:linkedin', color: 'text-blue-700 hover:text-blue-800', url: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { name: 'WhatsApp', icon: 'mdi:whatsapp', color: 'text-green-600 hover:text-green-700', url: (u: string) => `https://wa.me/?text=${encodeURIComponent(u)}` },
  { name: 'Telegram', icon: 'mdi:telegram', color: 'text-blue-500 hover:text-blue-600', url: (u: string) => `https://t.me/share/url?url=${encodeURIComponent(u)}` },
]

const route = useRoute()
const dialog = ref<'share' | 'cite' | null>(null)
const style = ref<CitationStyle>('MLA')
const pageUrl = computed(() => canonicalUrl(route.path))
const { copy, copied } = useClipboard({ copiedDuring: 3000 })

const citation = computed(() => buildCitation(style.value, {
  title: props.title,
  author: props.author,
  published: props.published,
  url: pageUrl.value,
}))

async function openShare() {
  // The native share sheet is the better choice on phones.
  if (navigator.share) {
    try {
      await navigator.share({ title: props.title, url: pageUrl.value })
      return
    } catch {
      // cancelled or unsupported payload: fall back to the dialog
    }
  }
  dialog.value = 'share'
}

const print = () => window.print()
</script>
