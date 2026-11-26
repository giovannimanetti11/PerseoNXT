import type { PlantData } from '#shared/types/plantData'

/** Unified open data of a plant. Cached for ten minutes; failures are not cached. */
export default defineCachedEventHandler(async (event): Promise<PlantData> => {
  const slug = plantSlug(event)
  const data = await plantDataFetch<PlantData>(event, `/v1/plants/${slug}`)
  // Trials carry long registry summaries: the page shows four, the rest load on demand.
  return data.trials ? { ...data, trials: { ...data.trials, items: data.trials.items.slice(0, TRIALS_PREVIEW) } } : data
}, {
  name: 'plant-data',
  maxAge: 60 * 10,
  swr: true,
  getKey: (event) => getRouterParam(event, 'slug') ?? '',
})
