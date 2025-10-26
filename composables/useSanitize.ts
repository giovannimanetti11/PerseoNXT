import DOMPurify from 'isomorphic-dompurify'

export function useSanitize() {
  const sanitizeHtml = (html: string | null | undefined): string => {
    if (!html) return ''
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'mark'],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class', 'id', 'style'],
      ALLOW_DATA_ATTR: false
    })
  }

  return {
    sanitizeHtml
  }
}
