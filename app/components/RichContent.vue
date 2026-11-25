<template>
  <div ref="container" @mouseover="onHover" @mouseleave="scheduleHide" @click="onClick" v-html="html"></div>

  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="preview && isWide"
        class="link-preview fixed bg-white border border-blu rounded-lg shadow-xl z-50 w-[600px] max-w-[90vw] max-h-[80vh] overflow-y-auto"
        :style="{ top: `${position.top}px`, left: `${position.left}px` }"
        role="tooltip"
        @mouseenter="cancelHide"
        @mouseleave="scheduleHide"
      >
        <div class="p-6">
          <p class="text-2xl font-bold text-blu mb-4">{{ preview.title }}</p>
          <div v-html="preview.excerpt"></div>
        </div>
      </div>
    </Teleport>

    <InfoDialog :open="Boolean(preview) && !isWide" :title="preview?.title ?? ''" @close="preview = null">
      <div v-html="preview?.excerpt ?? ''"></div>
      <NuxtLink
        v-if="preview"
        :to="preview.path"
        class="mt-4 block text-center w-full bg-verde text-white font-bold py-2 px-4 rounded-xl hover:bg-celeste transition-colors duration-300"
        @click="preview = null"
      >
        Vai alla pagina
      </NuxtLink>
    </InfoDialog>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useMediaQuery, useWindowScroll } from '@vueuse/core'

interface Preview {
  title: string
  excerpt: string
  path: string
}

interface PreviewNode {
  title: string
  excerpt: string | null
  slug: string
}

const props = defineProps<{ content: string }>()

const PREVIEW_QUERY = `
  query LinkPreview($slug: String!) {
    postBy(slug: $slug) { title excerpt slug }
    glossaryTermBy(slug: $slug) { title excerpt slug }
  }
`

const html = computed(() => sanitizeHtml(props.content))
const container = ref<HTMLElement | null>(null)
const preview = ref<Preview | null>(null)
const position = reactive({ top: 0, left: 0 })
const isWide = useMediaQuery('(min-width: 768px)')
const { query } = useGraphQL()
const router = useRouter()
const cache = new Map<string, Preview | null>()
let hideTimer: ReturnType<typeof setTimeout> | undefined
let hoveredHref = ''

/** Internal monograph or glossary link -> router path; null for anything else. */
function internalPath(anchor: HTMLAnchorElement): string | null {
  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('mailto:')) return null
  const url = new URL(href, SITE_URL)
  if (!/(^|\.)wikiherbalist\.com$/.test(url.hostname) || url.pathname.startsWith('/wp-content/')) return null
  return normalizePath(url.pathname)
}

async function loadPreview(path: string, linkText: string): Promise<Preview | null> {
  if (cache.has(path)) return cache.get(path) ?? null
  const segments = path.split('/').filter(Boolean)
  const isGlossary = segments[0] === 'glossario' && segments.length === 2
  if (!isGlossary && segments.length !== 1) return null

  try {
    const data = await query<{ postBy: PreviewNode | null; glossaryTermBy: PreviewNode | null }>(PREVIEW_QUERY, { slug: segments.at(-1) })
    const node = isGlossary ? data.glossaryTermBy : data.postBy
    const result = node
      ? {
          title: linkText ? linkText.charAt(0).toUpperCase() + linkText.slice(1) : decodeEntities(node.title),
          excerpt: sanitizeHtml(node.excerpt, 'excerpt'),
          path: contentPath(isGlossary ? 'glossary' : 'plant', node.slug),
        }
      : null
    cache.set(path, result)
    return result
  } catch {
    return null
  }
}

async function show(anchor: HTMLAnchorElement, path: string) {
  const result = await loadPreview(path, anchor.textContent?.trim() ?? '')
  if (!result || hoveredHref !== path) return
  const rect = anchor.getBoundingClientRect()
  const width = Math.min(600, window.innerWidth * 0.9)
  position.left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 8), window.innerWidth - width - 8)
  position.top = rect.bottom + 10
  preview.value = result
}

function onHover(event: MouseEvent) {
  if (!isWide.value) return
  const anchor = (event.target as Element).closest('a')
  if (!anchor) return
  const path = internalPath(anchor)
  if (!path || path === hoveredHref) return
  cancelHide()
  hoveredHref = path
  show(anchor, path)
}

function onClick(event: MouseEvent) {
  const anchor = (event.target as Element).closest('a')
  if (!anchor || event.ctrlKey || event.metaKey || event.shiftKey) return
  const path = internalPath(anchor)
  if (!path) return
  event.preventDefault()
  if (isWide.value) {
    preview.value = null
    router.push(path)
  } else {
    // On touch screens the first tap shows the definition, the dialog links to the page.
    hoveredHref = path
    show(anchor, path)
  }
}

function cancelHide() {
  clearTimeout(hideTimer)
}

function scheduleHide() {
  if (!isWide.value) return
  hideTimer = setTimeout(() => {
    preview.value = null
    hoveredHref = ''
  }, 300)
}

const { y } = useWindowScroll()
watch(y, () => {
  if (isWide.value) preview.value = null
})

onBeforeUnmount(() => clearTimeout(hideTimer))
</script>
