/**
 * Monographs live at /<scientific-slug>. Visitors (and old links) often use
 * the common name instead, e.g. /zenzero: when a first-level path matches a
 * plant title or one of its common names, answer with a 301 to the real slug.
 *
 * The lookup map is built on first use and refreshed every 6 hours.
 */

import type { WpConnection } from '#shared/types/wordpress'

interface NameNode {
  slug: string
  title: string | null
  nomeComune: string | null
}

const REFRESH_MS = 6 * 60 * 60 * 1000
const RETRY_AFTER_FAILURE_MS = 5 * 60 * 1000

// First-level routes that are never plant names.
const RESERVED = new Set([
  'about', 'disclaimer', 'privacy-policy', 'cookie-policy', 'donazioni', 'lavora-con-noi',
  'piante-medicinali', 'glossario', 'blog', 'algoliaUpdate', 'algoliaGlossaryUpdate',
  'algoliaBlogPostsUpdate', 'api', 'media', 'wp-content',
])

const NAMES_QUERY = `
  query CommonNames($first: Int!, $after: String) {
    posts(first: $first, after: $after, where: { status: PUBLISH }) {
      nodes { slug title nomeComune }
      pageInfo { hasNextPage endCursor }
    }
  }
`

let names = new Map<string, string>()
let nextRefresh = 0
let loading: Promise<void> | null = null

async function refresh(event: Parameters<typeof wpQueryAll>[0]): Promise<void> {
  try {
    const nodes = await wpQueryAll<{ posts: WpConnection<NameNode> }, NameNode>(event, NAMES_QUERY, (data) => data.posts)
    const map = new Map<string, string>()
    for (const node of nodes) {
      for (const name of [node.title ?? '', ...splitList(node.nomeComune)]) {
        const key = slugify(decodeEntities(name))
        if (key && key !== node.slug) map.set(key, node.slug)
      }
    }
    names = map
    nextRefresh = Date.now() + REFRESH_MS
  } catch (error) {
    console.error('[common-name-redirect] cannot load plant names:', error instanceof Error ? error.message : error)
    nextRefresh = Date.now() + RETRY_AFTER_FAILURE_MS
  }
}

export default defineEventHandler(async (event) => {
  const match = event.path.match(/^\/([^/?#]+)\/?(?:\?.*)?$/)
  const segment = match?.[1]
  if (!segment || RESERVED.has(segment) || segment.startsWith('_') || segment.includes('.')) return

  if (Date.now() >= nextRefresh) {
    loading ??= refresh(event).finally(() => { loading = null })
    // Only the very first request waits; later refreshes happen in the background.
    if (!names.size) await loading
  }

  const target = names.get(segment.toLowerCase())
  if (target && target !== segment) {
    return sendRedirect(event, `/${target}`, 301)
  }
})
