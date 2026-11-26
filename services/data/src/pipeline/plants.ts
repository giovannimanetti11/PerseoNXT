import { and, eq, notInArray } from 'drizzle-orm'
import type { Database } from '../db/index.js'
import { plants } from '../db/schema.js'
import type { HttpClient } from '../http/client.js'
import { collapseSpaces, decodeEntities } from '../normalize/text.js'

export interface WordPressPlant {
  slug: string
  title: string
  scientificName: string
}

interface PlantsPage {
  data?: {
    posts?: {
      nodes?: { slug?: string; title?: string; nomeScientifico?: string | null }[]
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null }
    }
  }
  errors?: unknown[]
}

const QUERY = `query DataPlants($first: Int!, $after: String) {
  posts(first: $first, after: $after, where: { status: PUBLISH }) {
    nodes { slug title nomeScientifico }
    pageInfo { hasNextPage endCursor }
  }
}`

/** Published plants with a scientific name, read anonymously like the site does. */
export async function fetchWordPressPlants(http: HttpClient, endpoint: string): Promise<WordPressPlant[]> {
  const result: WordPressPlant[] = []
  let after: string | null = null
  for (let page = 0; page < 50; page++) {
    const response: { data: PlantsPage } = await http.json<PlantsPage>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { first: 100, after } }),
    })
    const posts = response.data.data?.posts
    if (response.data.errors?.length || !posts) throw new Error('WordPress GraphQL returned errors')
    for (const node of posts.nodes ?? []) {
      const scientificName = collapseSpaces(node.nomeScientifico ?? '')
      if (node.slug && scientificName) {
        result.push({ slug: node.slug, title: decodeEntities(node.title ?? node.slug), scientificName })
      }
    }
    if (!posts.pageInfo?.hasNextPage || !posts.pageInfo.endCursor) break
    after = posts.pageInfo.endCursor
  }
  return result
}

/**
 * Upserts the WordPress list. Plants removed from WordPress are deactivated,
 * not deleted, so their data comes back if the post is republished.
 */
export async function syncPlants(db: Database, list: WordPressPlant[]): Promise<{ added: number; deactivated: number }> {
  if (!list.length) throw new Error('WordPress returned no plants: refusing to deactivate everything')
  const existing = new Set((await db.select({ slug: plants.slug }).from(plants)).map((row) => row.slug))
  for (const plant of list) {
    await db.insert(plants).values({ slug: plant.slug, wpTitle: plant.title, scientificName: plant.scientificName, active: true })
      .onConflictDoUpdate({
        target: plants.slug,
        set: { wpTitle: plant.title, scientificName: plant.scientificName, active: true },
      })
  }
  const slugs = list.map((plant) => plant.slug)
  const deactivated = await db.update(plants).set({ active: false })
    .where(and(eq(plants.active, true), notInArray(plants.slug, slugs)))
    .returning({ slug: plants.slug })
  return { added: slugs.filter((slug) => !existing.has(slug)).length, deactivated: deactivated.length }
}

export async function findPlant(db: Database, slug: string) {
  const [row] = await db.select().from(plants).where(eq(plants.slug, slug)).limit(1)
  return row ?? null
}
