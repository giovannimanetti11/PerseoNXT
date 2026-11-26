const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X')) return String.fromCodePoint(parseInt(code.slice(2), 16))
    if (code.startsWith('#')) return String.fromCodePoint(Number(code.slice(1)))
    return ENTITIES[code.toLowerCase()] ?? match
  })
}

export function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

export function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Comparison key for scientific names: case, diacritics, spacing and the
 * different hybrid markers ("x", "×", "X") do not matter.
 */
export function nameKey(name: string): string {
  return collapseSpaces(
    name
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/(^|\s)[x×X](?=\s)/g, '$1×')
      .replace(/×(?=\S)/g, '× ')
      .toLowerCase(),
  )
}

/** Comparison key for common names: also ignores punctuation and hyphens. */
export function commonNameKey(name: string): string {
  return collapseSpaces(
    name
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .toLowerCase(),
  )
}

/** "Zingiber officinale Roscoe" -> "Zingiber officinale" given the authorship. */
export function withoutAuthorship(scientificName: string, authorship: string): string {
  const name = collapseSpaces(scientificName)
  const author = collapseSpaces(authorship)
  return author && name.endsWith(author) ? name.slice(0, -author.length).trim() : name
}

/** First two words of a scientific name: genus and species epithet. */
export function binomial(name: string): string {
  return collapseSpaces(name).split(' ').slice(0, 2).join(' ')
}

export function normalizeDoi(doi: string): string {
  return doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:/i, '').toLowerCase()
}
