import type { PlantData } from '#shared/types/plantData'

/** Unified open data of a plant. Cached for ten minutes; failures are not cached. */
export default defineCachedEventHandler(async (event): Promise<PlantData> => {
  const slug = plantSlug(event)
  return plantDataFetch<PlantData>(event, `/v1/plants/${slug}`)
}, {
  name: 'plant-data',
  maxAge: 60 * 10,
  swr: true,
  getKey: (event) => getRouterParam(event, 'slug') ?? '',
})
