import type { Compound, Page } from '#shared/types/plantData'

/** Paginated and searchable compound list, for the table on the monograph. */
export default defineCachedEventHandler(async (event): Promise<Page<Compound>> => {
  const slug = plantSlug(event)
  const query = getQuery(event)
  const offset = Math.max(0, Math.min(Number(query.offset) || 0, 100_000))
  const limit = Math.max(1, Math.min(Number(query.limit) || 30, 100))
  const q = String(query.q ?? '').trim().slice(0, 80)
  return plantDataFetch<Page<Compound>>(event, `/v1/plants/${slug}/compounds`, { offset, limit, ...(q ? { q } : {}) })
}, {
  name: 'plant-compounds',
  maxAge: 60 * 10,
  getKey: (event) => {
    const query = getQuery(event)
    return `${getRouterParam(event, 'slug')}:${Number(query.offset) || 0}:${Number(query.limit) || 30}:${String(query.q ?? '').trim().toLowerCase()}`
  },
})
