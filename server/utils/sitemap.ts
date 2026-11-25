import { canonicalUrl } from '#shared/utils/site'

export interface SitemapEntry {
  path: string
  lastmod?: string
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: number
  image?: { loc: string; title: string }
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** WordPress dates carry no offset: keep their calendar day instead of converting to UTC. */
function isoDay(value: string | undefined): string {
  if (value && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  return new Date().toISOString().slice(0, 10)
}

export function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map((entry) => {
    const image = entry.image
      ? `\n    <image:image>\n      <image:loc>${escapeXml(entry.image.loc)}</image:loc>${entry.image.title ? `\n      <image:title>${escapeXml(entry.image.title)}</image:title>` : ''}\n    </image:image>`
      : ''
    return `  <url>
    <loc>${escapeXml(canonicalUrl(entry.path))}</loc>
    <lastmod>${isoDay(entry.lastmod)}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>${image}
  </url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`
}
