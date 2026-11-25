const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&#160;': ' ',
  '&amp;': '&',
  '&#038;': '&',
  '&quot;': '"',
  '&#039;': "'",
  '&#39;': "'",
  '&apos;': "'",
  '&#8217;': '’',
  '&#x2019;': '’',
  '&#8216;': '‘',
  '&#8220;': '“',
  '&#8221;': '”',
  '&#8211;': '-',
  '&#8230;': '…',
  '&hellip;': '…',
  '&lt;': '<',
  '&gt;': '>',
}

export function decodeEntities(text: string): string {
  return text.replace(/&(?:#x?[0-9a-f]+|[a-z]+);/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity)
}

/** Plain text from a WordPress HTML fragment (excerpts, descriptions). */
export function stripHtml(html: string | null | undefined): string {
  return decodeEntities((html ?? '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

const WORDS_PER_MINUTE = 200

/** Reading time in minutes, ignoring the bibliography after "Riferimenti". */
export function readingTimeMinutes(html: string | null | undefined): number {
  let text = stripHtml(html)
  const references = text.indexOf('Riferimenti')
  if (references !== -1) text = text.slice(0, references)
  const words = text ? text.split(' ').length : 0
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}

/** "15 marzo 2025", or the fallback when the date is missing or invalid. */
export function formatItalianDate(value: string | null | undefined, fallback = 'data non disponibile'): string {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? fallback
    : date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** True when two ISO dates fall on different calendar days. */
export function isDifferentDay(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  const first = new Date(a)
  const second = new Date(b)
  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) return false
  return first.toDateString() !== second.toDateString()
}

/** Splits WordPress list fields ("foglie, fiori; radice") into trimmed items. */
export function splitList(value: string | null | undefined): string[] {
  return (value ?? '').split(/\s*[;,\n]\s*/).map((item) => item.trim()).filter(Boolean)
}

export const EDITORIAL_AUTHOR = 'Redazione di Wikiherbalist'
const EDITORIAL_ACCOUNTS = new Set(['wh_admin', 'Redazione Wikiherbalist', 'Team Wikiherbalist', EDITORIAL_AUTHOR])

export function isEditorialAuthor(name: string | null | undefined): boolean {
  return !name || EDITORIAL_ACCOUNTS.has(name)
}

export function displayAuthorName(name: string | null | undefined): string {
  return isEditorialAuthor(name) ? EDITORIAL_AUTHOR : decodeEntities(name ?? '')
}

/** Lowercase ASCII slug: "Tempo balsamico" -> "tempo-balsamico". */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** First letter used to group entries alphabetically ("Échinacea" -> "E"). */
export function initialLetter(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase()
}
