import { describe, it, expect } from 'vitest'
import DOMPurify from 'isomorphic-dompurify'

describe('HTML Sanitization', () => {
  it('should allow safe HTML tags', () => {
    const html = '<p>Test <strong>bold</strong> text</p>'
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'br']
    })

    expect(sanitized).toContain('<p>')
    expect(sanitized).toContain('<strong>')
    expect(sanitized).toContain('Test')
    expect(sanitized).toContain('bold')
  })

  it('should remove script tags', () => {
    const html = '<p>Test</p><script>alert("XSS")</script>'
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'strong', 'em']
    })

    expect(sanitized).not.toContain('<script>')
    expect(sanitized).not.toContain('alert')
    expect(sanitized).toContain('<p>')
  })

  it('should remove dangerous attributes', () => {
    const html = '<a href="javascript:alert(\'XSS\')">Click</a>'
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['a'],
      ALLOWED_ATTR: ['href']
    })

    expect(sanitized).not.toContain('javascript:')
  })

  it('should handle empty or null input', () => {
    expect(DOMPurify.sanitize('')).toBe('')
    expect(DOMPurify.sanitize(null as any)).toBe('')
  })

  it('should preserve safe links', () => {
    const html = '<a href="https://example.com" title="Example">Link</a>'
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['a'],
      ALLOWED_ATTR: ['href', 'title']
    })

    expect(sanitized).toContain('href="https://example.com"')
    expect(sanitized).toContain('title="Example"')
    expect(sanitized).toContain('Link')
  })
})
