import type { ClinicalTrial, Page } from '#shared/types/plantData'

const STATUS = /^[A-Z_]{2,40}$/

/** Paginated trial list, optionally for one ClinicalTrials.gov status. */
export default defineCachedEventHandler(async (event): Promise<Page<ClinicalTrial>> => {
  const slug = plantSlug(event)
  const query = getQuery(event)
  const offset = Math.max(0, Math.min(Number(query.offset) || 0, 100_000))
  const limit = Math.max(1, Math.min(Number(query.limit) || 20, 100))
  const status = String(query.status ?? '')
  return plantDataFetch<Page<ClinicalTrial>>(event, `/v1/plants/${slug}/trials`, { offset, limit, ...(STATUS.test(status) ? { status } : {}) })
}, {
  name: 'plant-trials',
  maxAge: 60 * 10,
  getKey: (event) => {
    const query = getQuery(event)
    return `${getRouterParam(event, 'slug')}:${Number(query.offset) || 0}:${Number(query.limit) || 20}:${String(query.status ?? '').replace(/[^A-Z_]/g, '')}`
  },
})
