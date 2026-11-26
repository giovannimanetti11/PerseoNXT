/** Italian Wikipedia summary and Wikimedia Commons images linked from Wikidata. */
import type { MediaItem, Summary } from '../types.js'
import { collapseSpaces, stripHtml } from '../normalize/text.js'
import type { SourceContext } from './context.js'

export interface WikipediaSummaryResponse {
  type?: string
  extract?: string
  content_urls?: { desktop?: { page?: string } }
}

export function parseSummary(data: WikipediaSummaryResponse): Summary | null {
  const text = collapseSpaces(data.extract ?? '')
  const url = data.content_urls?.desktop?.page
  // Disambiguation pages have no useful extract.
  if (!text || !url || data.type === 'disambiguation') return null
  return { text, url, license: 'CC BY-SA 4.0' }
}

export async function fetchWikipediaSummary(ctx: SourceContext, title: string): Promise<Summary | null> {
  const path = encodeURIComponent(title.replace(/ /g, '_'))
  const data = await ctx.get<WikipediaSummaryResponse>('wikipedia', 'summary', `https://it.wikipedia.org/api/rest_v1/page/summary/${path}`)
  return parseSummary(data)
}

interface ExtValue {
  value?: string
}

interface ImageInfo {
  url?: string
  thumburl?: string
  descriptionurl?: string
  extmetadata?: Record<string, ExtValue | undefined>
}

export interface CommonsResponse {
  query?: { pages?: Record<string, { title?: string; missing?: string; imageinfo?: ImageInfo[] }> }
}

/** Public domain, CC0, CC BY and CC BY-SA allow use on a commercial site with attribution. */
export function isAllowedCommonsLicense(license: string): boolean {
  const value = license.toLowerCase()
  if (/\bnc\b|\bnd\b|non-commercial|noncommercial|no deriv/.test(value)) return false
  return /^(public domain|pd\b|cc0|cc[ -]by(-sa)?\b)/.test(value)
}

/** Commons adds tracking parameters to file URLs; they are not needed to load the file. */
export function cleanCommonsUrl(url: string): string {
  const parsed = new URL(url, 'https://commons.wikimedia.org')
  for (const key of [...parsed.searchParams.keys()]) if (key.startsWith('utm_')) parsed.searchParams.delete(key)
  return parsed.toString()
}

export function parseCommons(data: CommonsResponse): MediaItem[] {
  return Object.values(data.query?.pages ?? {}).flatMap((page) => {
    const info = page.imageinfo?.[0]
    const meta = info?.extmetadata ?? {}
    const license = collapseSpaces(meta.LicenseShortName?.value ?? '')
    if (page.missing !== undefined || !info?.url || !page.title || !isAllowedCommonsLicense(license)) return []
    const author = stripHtml(meta.Artist?.value ?? '') || 'Autore sconosciuto'
    return [{
      source: 'commons' as const,
      sourceId: page.title,
      url: cleanCommonsUrl(info.url),
      thumbnailUrl: cleanCommonsUrl(info.thumburl ?? info.url),
      pageUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
      license,
      author,
      credit: `Immagine: ${author}, ${license}, Wikimedia Commons`,
    }]
  })
}

export async function fetchCommonsImages(ctx: SourceContext, files: string[]): Promise<MediaItem[]> {
  const titles = files.slice(0, 20).map((file) => `File:${file}`)
  if (!titles.length) return []
  const data = await ctx.get<CommonsResponse>('commons', 'imageinfo', 'https://commons.wikimedia.org/w/api.php', {
    query: { action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: 800, titles: titles.join('|') },
  })
  return parseCommons(data)
}
