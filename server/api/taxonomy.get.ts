import type { TaxonomyInfo } from '#shared/types/content'

interface GbifMatch {
  usageKey?: number
  kingdom?: string
  phylum?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  species?: string
}

interface GbifSpecies {
  basionym?: string
}

interface GbifSynonyms {
  results?: { taxonomicStatus?: string; scientificName?: string; canonicalName?: string }[]
}

const RANKS: [keyof GbifMatch, string][] = [
  ['kingdom', 'Regno'],
  ['phylum', 'Phylum'],
  ['class', 'Classe'],
  ['order', 'Ordine'],
  ['family', 'Famiglia'],
  ['genus', 'Genere'],
  ['species', 'Specie'],
]

const GBIF = 'https://api.gbif.org/v1'
const headers = { 'User-Agent': 'Wikiherbalist/1.0 (wikiherbalist.com)' }
const EMPTY: TaxonomyInfo = { basionym: '', synonyms: [], classification: [] }

/** Basionym, synonyms and classification of a species from GBIF. */
export default defineCachedEventHandler(async (event): Promise<TaxonomyInfo> => {
  const name = String(getQuery(event).name ?? '').trim()
  if (!name || name.length > 200) throw createError({ statusCode: 400, statusMessage: 'Parametro name mancante' })

  try {
    const match = await $fetch<GbifMatch>(`${GBIF}/species/match`, { query: { name, verbose: true }, headers, timeout: 10_000 })
    if (!match.usageKey) return EMPTY

    const [species, synonyms] = await Promise.all([
      $fetch<GbifSpecies>(`${GBIF}/species/${match.usageKey}`, { headers, timeout: 10_000 }),
      $fetch<GbifSynonyms>(`${GBIF}/species/${match.usageKey}/synonyms`, { headers, timeout: 10_000 }),
    ])

    return {
      basionym: species.basionym ?? '',
      synonyms: (synonyms.results ?? [])
        .filter((item) => item.taxonomicStatus === 'SYNONYM')
        .map((item) => item.scientificName || item.canonicalName || '')
        .filter(Boolean),
      classification: RANKS.flatMap(([key, rank]) => {
        const value = match[key]
        return typeof value === 'string' && value
          ? [{ rank, name: value, link: `https://it.wikipedia.org/wiki/${encodeURIComponent(value)}` }]
          : []
      }),
    }
  } catch (error) {
    // Not cached: Nitro only stores successful responses.
    console.error('[taxonomy] GBIF request failed:', error instanceof Error ? error.message : error)
    throw createError({ statusCode: 502, statusMessage: 'GBIF non disponibile' })
  }
}, {
  name: 'taxonomy',
  maxAge: 60 * 60 * 24,
  getKey: (event) => String(getQuery(event).name ?? '').trim().toLowerCase(),
})
