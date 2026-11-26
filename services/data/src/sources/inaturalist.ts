import type { CommonName, MediaItem } from '../types.js'
import { collapseSpaces, nameKey } from '../normalize/text.js'
import type { SourceContext } from './context.js'

const API = 'https://api.inaturalist.org/v1'
/** Commercial site: only licenses that allow it. */
const ALLOWED_LICENSES: Record<string, string> = { cc0: 'CC0 1.0', 'cc-by': 'CC BY 4.0' }

interface InatPhoto {
  id?: number
  license_code?: string | null
  attribution?: string
  url?: string
  medium_url?: string
}

interface InatTaxon {
  id?: number
  name?: string
  rank?: string
  is_active?: boolean
  preferred_common_name?: string
  english_common_name?: string
  observations_count?: number
  taxon_photos?: { photo?: InatPhoto }[]
}

export interface InatResponse {
  results?: InatTaxon[]
}

export interface InatTaxonData {
  id: number
  observations: number
  commonNames: CommonName[]
  photos: MediaItem[]
}

export const inatTaxonUrl = (id: number) => `https://www.inaturalist.org/taxa/${id}`

/** Exact name match only, so "Verbena" never resolves to another species of the genus. */
export function pickTaxon(data: InatResponse, scientificName: string): InatTaxon | null {
  const wanted = nameKey(scientificName)
  return (data.results ?? []).find((taxon) => taxon.is_active !== false && taxon.name && nameKey(taxon.name) === wanted) ?? null
}

/** "(c) Jane Doe, some rights reserved (CC BY), uploaded by Jane Doe" -> "Jane Doe". */
export function photoAuthor(attribution: string): string {
  const match = attribution.match(/^\(c\)\s*(.+?),\s*(some|no|all) rights/i)
  return collapseSpaces(match?.[1] ?? attribution.replace(/^\(c\)\s*/i, ''))
}

export function parseTaxon(taxon: InatTaxon): InatTaxonData | null {
  if (!taxon.id) return null
  const id = taxon.id
  const photos = (taxon.taxon_photos ?? []).flatMap(({ photo }) => {
    const license = ALLOWED_LICENSES[photo?.license_code ?? '']
    if (!photo?.id || !photo.url || !license) return []
    const author = photoAuthor(photo.attribution ?? '')
    const large = photo.url.replace(/\/square\.(jpe?g|png)$/i, '/large.$1')
    return [{
      source: 'inaturalist' as const,
      sourceId: String(photo.id),
      url: large,
      thumbnailUrl: photo.medium_url ?? photo.url,
      pageUrl: `https://www.inaturalist.org/photos/${photo.id}`,
      license,
      author,
      credit: `Foto: ${author}, ${license}, iNaturalist`,
    }]
  })
  const preferred = collapseSpaces(taxon.preferred_common_name ?? '')
  const english = collapseSpaces(taxon.english_common_name ?? '')
  const scientific = nameKey(taxon.name ?? '')
  const source = [{ source: 'inaturalist' as const, url: inatTaxonUrl(id) }]
  // With locale=it the preferred name falls back to English when no Italian one exists.
  const italian = preferred && nameKey(preferred) !== nameKey(english) ? preferred : ''
  const commonNames = [
    ...(italian && nameKey(italian) !== scientific ? [{ name: italian, lang: 'it', sources: source }] : []),
    ...(english && nameKey(english) !== scientific ? [{ name: english, lang: 'en', sources: source }] : []),
  ]
  return {
    id,
    observations: taxon.observations_count ?? 0,
    commonNames,
    photos,
  }
}

export async function fetchInaturalist(ctx: SourceContext, scientificName: string, knownId: number | null): Promise<InatTaxonData | null> {
  let id = knownId
  if (!id) {
    const search = await ctx.get<InatResponse>('inaturalist', 'search', `${API}/taxa`, {
      query: { q: scientificName, rank: 'species', per_page: 10, locale: 'it' },
    })
    id = pickTaxon(search, scientificName)?.id ?? null
  }
  if (!id) return null
  const data = await ctx.get<InatResponse>('inaturalist', 'taxon', `${API}/taxa/${id}`, { query: { locale: 'it' } })
  const taxon = data.results?.[0]
  return taxon ? parseTaxon(taxon) : null
}
