import type { H3Event } from 'h3'
import type { ContentType, SearchRecord } from '#shared/types/content'
import type { WpConnection, WpImageEdge } from '#shared/types/wordpress'

interface AlgoliaCredentials {
  applicationId: string
  indexName: string
  apiKey: string
}

function credentials(event: H3Event, write: boolean): AlgoliaCredentials {
  const config = useRuntimeConfig(event)
  const { applicationId, searchApiKey, indexName } = config.public.algolia
  const apiKey = write ? config.algoliaWriteApiKey : searchApiKey
  if (!applicationId || !apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Algolia non configurato' })
  }
  return { applicationId, indexName, apiKey }
}

function algoliaFetch<T>(creds: AlgoliaCredentials, path: string, body: Record<string, unknown>): Promise<T> {
  return $fetch<T>(`https://${creds.applicationId}.algolia.net/1/indexes/${creds.indexName}${path}`, {
    method: 'POST',
    headers: {
      'X-Algolia-API-Key': creds.apiKey,
      'X-Algolia-Application-Id': creds.applicationId,
    },
    body,
    timeout: 20_000,
  })
}

/** objectIDs currently indexed for a content type. */
export async function indexedObjectIds(event: H3Event, type: ContentType): Promise<string[]> {
  const creds = credentials(event, false)
  const result = await algoliaFetch<{ hits: { objectID: string }[] }>(creds, '/query', {
    query: '',
    filters: `contentType:${type}`,
    hitsPerPage: 1000,
    attributesToRetrieve: ['objectID'],
    attributesToHighlight: [],
  })
  return result.hits.map((hit) => hit.objectID)
}

/** Upserts records and deletes the given objectIDs in batches of 500. */
export async function writeRecords(event: H3Event, records: SearchRecord[], deleteIds: string[]): Promise<void> {
  const creds = credentials(event, true)
  const requests = [
    ...records.map((record) => ({ action: 'updateObject', body: record })),
    ...deleteIds.map((objectID) => ({ action: 'deleteObject', body: { objectID } })),
  ]
  for (let start = 0; start < requests.length; start += 500) {
    await algoliaFetch(creds, '/batch', { requests: requests.slice(start, start + 500) })
  }
}

// ---------------------------------------------------------------------------
// WordPress -> Algolia records. objectID is always the WordPress slug, which is
// also the URL segment: the search box builds links from it.
// ---------------------------------------------------------------------------

interface IndexableNode {
  slug: string
  title: string
  nomeScientifico?: string | null
  authorName?: string | null
  featuredImage?: WpImageEdge | null
}

const SOURCES: Record<ContentType, { query: string; connection: string }> = {
  plant: {
    connection: 'posts',
    query: `query IndexPlants($first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { status: PUBLISH }) {
        nodes { slug title nomeScientifico authorName featuredImage { node { sourceUrl } } }
        pageInfo { hasNextPage endCursor }
      }
    }`,
  },
  glossary: {
    connection: 'glossaryTerms',
    query: `query IndexGlossary($first: Int!, $after: String) {
      glossaryTerms(first: $first, after: $after) {
        nodes { slug title featuredImage { node { sourceUrl } } }
        pageInfo { hasNextPage endCursor }
      }
    }`,
  },
  blog: {
    connection: 'blogPosts',
    query: `query IndexBlog($first: Int!, $after: String) {
      blogPosts(first: $first, after: $after) {
        nodes { slug title authorName featuredImage { node { sourceUrl } } }
        pageInfo { hasNextPage endCursor }
      }
    }`,
  },
}

function toRecord(type: ContentType, node: IndexableNode): SearchRecord {
  const title = decodeEntities(node.title)
  const record: SearchRecord = {
    objectID: node.slug,
    title,
    contentType: type,
    imageUrl: node.featuredImage?.node?.sourceUrl ?? '',
    imageAlt: title,
  }
  if (type === 'plant') record.nomeScientifico = node.nomeScientifico ?? ''
  if (type !== 'glossary') record.authorName = displayAuthorName(node.authorName)
  return record
}

export async function wordpressRecords(event: H3Event, type: ContentType): Promise<SearchRecord[]> {
  const { query, connection } = SOURCES[type]
  const nodes = await wpQueryAll<Record<string, WpConnection<IndexableNode>>, IndexableNode>(
    event,
    query,
    (data) => data[connection],
  )
  return nodes.filter((node) => node.slug).map((node) => toRecord(type, node))
}

// ---------------------------------------------------------------------------
// Admin guard shared by /api/algolia/status and /api/algolia/sync
// ---------------------------------------------------------------------------

const CONTENT_TYPES: ContentType[] = ['plant', 'glossary', 'blog']
const adminLimiter = createRateLimiter(5, 15 * 60 * 1000)

export function parseContentType(value: unknown): ContentType {
  const type = CONTENT_TYPES.find((candidate) => candidate === value)
  if (!type) throw createError({ statusCode: 400, statusMessage: 'Tipo di contenuto non valido' })
  return type
}

/** Rate limit per IP, then password check. Throws 429/401. */
export async function requireAdmin(event: H3Event, password: unknown, action: string): Promise<void> {
  const ip = clientIp(event)
  const wait = adminLimiter.retryAfter(ip)
  if (wait > 0) {
    auditLog(action, ip, false, `rate limited for ${wait}s`)
    throw createError({ statusCode: 429, statusMessage: `Troppi tentativi, riprova tra ${Math.ceil(wait / 60)} minuti` })
  }
  if (!(await verifyAdminPassword(event, password))) {
    adminLimiter.hit(ip)
    auditLog(action, ip, false, 'invalid password')
    throw createError({ statusCode: 401, statusMessage: 'Password non valida' })
  }
  adminLimiter.reset(ip)
  auditLog(action, ip, true)
}
