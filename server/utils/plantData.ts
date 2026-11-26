import type { H3Event } from 'h3'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function plantSlug(event: H3Event): string {
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!SLUG.test(slug) || slug.length > 120) throw createError({ statusCode: 400, statusMessage: 'Slug non valido' })
  return slug
}

/**
 * GET on the plant data service. A 404 stays a 404 (plant not collected yet);
 * anything else becomes 502, which the page treats as "no extra data".
 */
export async function plantDataFetch<T>(event: H3Event, path: string, query?: Record<string, string | number>): Promise<T> {
  const base = useRuntimeConfig(event).plantDataUrl
  try {
    return await $fetch<T>(`${base}${path}`, { query, timeout: 5_000, retry: 0 })
  } catch (error) {
    const status = error instanceof Error && 'statusCode' in error ? Number(error.statusCode) : 0
    if (status === 404) throw createError({ statusCode: 404, statusMessage: 'Dati non disponibili' })
    console.error(`[plant-data] ${path} failed${status ? ` (${status})` : ''}`)
    throw createError({ statusCode: 502, statusMessage: 'Servizio dati non disponibile' })
  }
}
