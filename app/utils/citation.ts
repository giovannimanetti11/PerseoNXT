export type CitationStyle = 'MLA' | 'APA' | 'Wikipedia'

export const CITATION_STYLES: { value: CitationStyle; label: string }[] = [
  { value: 'MLA', label: 'MLA 9th edition' },
  { value: 'APA', label: 'APA 7th edition' },
  { value: 'Wikipedia', label: 'Wikipedia' },
]

export interface CitationSource {
  title: string
  author: string
  published: string
  url: string
}

export interface CitationPart {
  text: string
  italic: boolean
}

const month = (date: Date) => date.toLocaleString('en-US', { month: 'long' })
const isoDay = (date: Date) => date.toISOString().slice(0, 10)

/**
 * Citation split into plain and italic runs: the title (MLA, APA) and the
 * site name (MLA) are set in italics. `accessed` defaults to today.
 */
export function buildCitation(style: CitationStyle, source: CitationSource, accessed = new Date()): CitationPart[] {
  const published = new Date(source.published)
  const date = Number.isNaN(published.getTime()) ? accessed : published
  const plain = (text: string): CitationPart => ({ text, italic: false })
  const italic = (text: string): CitationPart => ({ text, italic: true })

  switch (style) {
    case 'MLA':
      return [
        plain(`${source.author}. "`),
        italic(source.title),
        plain('." '),
        italic('Wikiherbalist'),
        plain(`, ${date.getDate()} ${month(date)} ${date.getFullYear()}, ${source.url}. Accessed ${accessed.getDate()} ${month(accessed)} ${accessed.getFullYear()}.`),
      ]
    case 'APA':
      return [
        plain(`${source.author}. (${date.getFullYear()}, ${month(date)} ${date.getDate()}). `),
        italic(source.title),
        plain(`. Wikiherbalist. ${source.url}`),
      ]
    case 'Wikipedia':
      return [plain(`{{cite web |title=${source.title} |url=${source.url} |website=Wikiherbalist |author=${source.author} |date=${isoDay(date)} |access-date=${isoDay(accessed)}}}`)]
  }
}

export const citationText = (parts: CitationPart[]): string => parts.map((part) => part.text).join('')
