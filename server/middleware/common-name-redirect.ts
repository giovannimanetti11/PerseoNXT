/**
 * Redirect da nomi comuni a slug scientifici
 *
 * Intercetta richieste a /:slug/ di primo livello.
 * Se lo slug non corrisponde a un post WordPress (nome scientifico),
 * cerca nei campi nomeComune di tutti i post e fa un redirect 301
 * verso lo slug scientifico corretto.
 *
 * La mappa nomeComune -> slug viene costruita al primo avvio e cachata in memoria.
 */

// Cache module-level: nomeComune (lowercase, trimmed) -> scientific slug
let commonNameMap: Map<string, string> | null = null
let cacheBuilding = false

// Route di primo livello che non sono piante medicinali
const KNOWN_ROUTES = new Set([
  'about', 'disclaimer', 'privacy-policy', 'cookie-policy', 'donazioni',
  'piante-medicinali', 'glossario', 'blog', 'algoliaUpdate', 'algoliaGlossaryUpdate',
  'algoliaBlogPostsUpdate', 'api', '_nuxt', '_ipx', 'sitemap.xml', 'robots.txt',
  'llms.txt', 'favicon.ico'
])

async function buildCommonNameMap(config: ReturnType<typeof useRuntimeConfig>) {
  const endpoint = config.wpBaseUrl as string
  const username = config.wpUsername as string
  const password = config.wpAppPassword as string

  if (!endpoint || !username || !password) return

  const auth = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`

  const query = `
    query FetchNomiComuni($first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { status: PUBLISH }) {
        nodes { slug title nomeComune }
        pageInfo { hasNextPage endCursor }
      }
    }
  `

  const map = new Map<string, string>()
  let after: string | null = null
  let hasNext = true

  while (hasNext) {
    const res = await $fetch<any>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': auth },
      body: JSON.stringify({ query, variables: { first: 100, after } })
    })

    const nodes = res?.data?.posts?.nodes || []
    for (const node of nodes) {
      if (!node.slug) continue

      const toKey = (str: string) =>
        str.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')

      // Titolo articolo (es. "Achillea" -> "achillea")
      if (node.title) {
        const key = toKey(node.title)
        if (key && key !== node.slug) map.set(key, node.slug)
      }

      // nomeComune: stringa con nomi separati da virgola, newline, o punto e virgola
      if (node.nomeComune) {
        const names = node.nomeComune.split(/[,;\n]+/)
        for (const name of names) {
          const key = toKey(name)
          if (key && key !== node.slug) map.set(key, node.slug)
        }
      }
    }

    hasNext = Boolean(res?.data?.posts?.pageInfo?.hasNextPage)
    after = res?.data?.posts?.pageInfo?.endCursor || null
  }

  return map
}

export default defineEventHandler(async (event) => {
  const path = event.path || getRequestURL(event).pathname

  // Considera solo percorsi di primo livello: /slug o /slug/
  const match = path.match(/^\/([^/]+)\/?$/)
  if (!match) return

  const slug = match[1]

  // Salta route note, asset, api, ecc.
  if (KNOWN_ROUTES.has(slug) || slug.startsWith('_') || slug.includes('.')) return

  // Avvia costruzione mappa se non ancora pronta
  if (!commonNameMap && !cacheBuilding) {
    cacheBuilding = true
    try {
      const config = useRuntimeConfig()
      commonNameMap = await buildCommonNameMap(config) || new Map()
    } catch (e) {
      console.error('[common-name-redirect] Errore build mappa:', e)
      commonNameMap = new Map()
    } finally {
      cacheBuilding = false
    }
  }

  // Aspetta che la mappa sia pronta (race condition iniziale)
  if (!commonNameMap) return

  const scientificSlug = commonNameMap.get(slug.toLowerCase())
  if (scientificSlug && scientificSlug !== slug) {
    const trailingSlash = path.endsWith('/') ? '/' : ''
    return sendRedirect(event, `/${scientificSlug}${trailingSlash}`, 301)
  }
})
