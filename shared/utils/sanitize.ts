import DOMPurify from 'isomorphic-dompurify'

type SanitizeProfile = 'content' | 'excerpt' | 'highlight'

const PROFILES: Record<SanitizeProfile, { ALLOWED_TAGS: string[]; ALLOWED_ATTR: string[] }> = {
  // WordPress bodies: monographs, glossary terms, blog posts, tag descriptions.
  content: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'sub', 'sup', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'mark'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class', 'id', 'width', 'height', 'style'],
  },
  // Short previews shown in tooltips.
  excerpt: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  },
  // Algolia highlight markup, already rewritten to <mark>.
  highlight: {
    ALLOWED_TAGS: ['mark'],
    ALLOWED_ATTR: [],
  },
}

export function sanitizeHtml(html: string | null | undefined, profile: SanitizeProfile = 'content'): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, { ...PROFILES[profile], ALLOW_DATA_ATTR: false })
}
