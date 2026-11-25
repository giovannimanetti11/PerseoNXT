import type { ContentType } from '../types/content'

export const SITE_URL = 'https://wikiherbalist.com'
export const SITE_NAME = 'Wikiherbalist'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/media/default-og-image.jpg`
export const PUBLISHER_LOGO = `${SITE_URL}/media/logo.png`

const CONTENT_PREFIX: Record<ContentType, string> = {
  plant: '',
  glossary: '/glossario',
  blog: '/blog',
}

/** Public path of a WordPress entry on the frontend. */
export function contentPath(type: ContentType, slug: string): string {
  return `${CONTENT_PREFIX[type]}/${slug}`
}

/** Absolute URL with single slashes and no trailing slash. */
export function canonicalUrl(path: string): string {
  const clean = `/${path}`.replace(/\/{2,}/g, '/').replace(/\/+$/, '')
  return `${SITE_URL}${clean}`
}

/** Normalizes a WordPress uri ("//achillea-millefolium/") to a router path. */
export function normalizePath(uri: string): string {
  return `/${uri}`.replace(/\/{2,}/g, '/').replace(/(.)\/+$/, '$1')
}

/** WordPress returns media on the admin host, the frontend serves wp-content itself. */
export function publicMediaUrl(url: string): string {
  return url.replace(/^https?:\/\/admin\.wikiherbalist\.com\/wp-content\//, `${SITE_URL}/wp-content/`)
}
