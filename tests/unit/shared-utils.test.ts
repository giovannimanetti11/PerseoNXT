import { describe, expect, it } from 'vitest'
import { checkFeedbackComment } from '#shared/utils/feedback'
import { sanitizeHtml } from '#shared/utils/sanitize'
import { canonicalUrl, contentPath, normalizePath, publicMediaUrl } from '#shared/utils/site'
import { displayAuthorName, initialLetter, readingTimeMinutes, slugify, splitList, stripHtml } from '#shared/utils/text'

describe('text helpers', () => {
  it('strips tags and decodes WordPress entities', () => {
    expect(stripHtml('<p>L&#8217;infuso&nbsp;<strong>caldo</strong>&hellip;</p>')).toBe('L’infuso caldo …')
  })

  it('splits list fields on commas, semicolons and newlines', () => {
    expect(splitList('foglie, fiori;radice\n semi ')).toEqual(['foglie', 'fiori', 'radice', 'semi'])
    expect(splitList(null)).toEqual([])
  })

  it('ignores the bibliography when computing the reading time', () => {
    const body = `<p>${'parola '.repeat(400)}</p><p>Riferimenti</p><p>${'fonte '.repeat(4000)}</p>`
    expect(readingTimeMinutes(body)).toBe(3)
    expect(readingTimeMinutes('')).toBe(1)
  })

  it('maps editorial accounts to the newsroom name', () => {
    expect(displayAuthorName('wh_admin')).toBe('Redazione di Wikiherbalist')
    expect(displayAuthorName('')).toBe('Redazione di Wikiherbalist')
    expect(displayAuthorName('Miriana Ninivaggi')).toBe('Miriana Ninivaggi')
  })

  it('slugifies and groups accented names', () => {
    expect(slugify('Tè verde')).toBe('te-verde')
    expect(initialLetter('Échinacea')).toBe('E')
  })
})

describe('site helpers', () => {
  it('builds frontend paths per content type', () => {
    expect(contentPath('plant', 'zingiber-officinale')).toBe('/zingiber-officinale')
    expect(contentPath('glossary', 'tisana')).toBe('/glossario/tisana')
    expect(contentPath('blog', 'vitamina-d')).toBe('/blog/vitamina-d')
  })

  it('normalizes slashes in paths and canonicals', () => {
    expect(normalizePath('//achillea-millefolium/')).toBe('/achillea-millefolium')
    expect(canonicalUrl('/blog/')).toBe('https://wikiherbalist.com/blog')
    expect(canonicalUrl('/')).toBe('https://wikiherbalist.com')
  })

  it('moves WordPress media to the public host', () => {
    expect(publicMediaUrl('https://admin.wikiherbalist.com/wp-content/uploads/a.jpg')).toBe('https://wikiherbalist.com/wp-content/uploads/a.jpg')
  })
})

describe('sanitizeHtml', () => {
  it('removes scripts and event handlers from content', () => {
    const clean = sanitizeHtml('<p onclick="x()">Ok</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>')
    expect(clean).toBe('<p>Ok</p><a>x</a>')
  })

  it('keeps only <mark> in search highlights', () => {
    expect(sanitizeHtml('<mark>Zen</mark>zero<img src=x onerror=alert(1)>', 'highlight')).toBe('<mark>Zen</mark>zero')
  })
})

describe('checkFeedbackComment', () => {
  it('accepts ordinary Italian text with typographic quotes', () => {
    expect(checkFeedbackComment('Utile, l’ho letta tutta: “ottima” al 100%!')).toEqual({ ok: true })
  })

  it('rejects markup and injection attempts', () => {
    expect(checkFeedbackComment('<script>alert(1)</script>')).toMatchObject({ ok: false, reason: 'invalid_characters' })
    expect(checkFeedbackComment("1' union select password")).toMatchObject({ ok: false, reason: 'suspicious' })
  })

  it('enforces the length limit', () => {
    expect(checkFeedbackComment('a'.repeat(201))).toMatchObject({ ok: false, reason: 'too_long' })
  })
})
