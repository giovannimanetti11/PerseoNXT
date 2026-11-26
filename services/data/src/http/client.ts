/**
 * HTTP client shared by every source: one queue per host with a minimum
 * interval between requests, timeouts, and retries with backoff on 429, 5xx
 * and network errors. Retry-After is honoured when the server sends it.
 */

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message)
  }
}

export interface HostPolicy {
  /** Minimum milliseconds between two requests to the host. */
  minIntervalMs: number
  timeoutMs?: number
  retries?: number
}

export interface RequestOptions {
  method?: 'GET' | 'POST'
  query?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
  body?: string
  timeoutMs?: number
}

export interface HttpResult<T> {
  status: number
  data: T
  durationMs: number
  url: string
}

const DEFAULT_POLICY: HostPolicy = { minIntervalMs: 250, timeoutMs: 20_000, retries: 2 }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function retryAfterMs(header: string | null): number | null {
  if (!header) return null
  const seconds = Number(header)
  if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 60_000)
  const date = Date.parse(header)
  return Number.isNaN(date) ? null : Math.min(Math.max(date - Date.now(), 0), 60_000)
}

export function buildUrl(base: string, query: RequestOptions['query'] = {}): string {
  const url = new URL(base)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  return url.toString()
}

export class HttpClient {
  private readonly queues = new Map<string, Promise<unknown>>()
  private readonly lastRequest = new Map<string, number>()

  constructor(
    private readonly userAgent: string,
    private readonly policies: Record<string, HostPolicy> = {},
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private policy(host: string): HostPolicy {
    return { ...DEFAULT_POLICY, ...this.policies[host] }
  }

  /** Serializes requests per host so the interval is respected under concurrency. */
  private schedule<T>(host: string, task: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(host) ?? Promise.resolve()
    const run = previous.catch(() => undefined).then(async () => {
      const wait = (this.lastRequest.get(host) ?? 0) + this.policy(host).minIntervalMs - Date.now()
      if (wait > 0) await sleep(wait)
      try {
        return await task()
      } finally {
        this.lastRequest.set(host, Date.now())
      }
    })
    this.queues.set(host, run)
    return run
  }

  async json<T>(base: string, options: RequestOptions = {}): Promise<HttpResult<T>> {
    const url = buildUrl(base, options.query)
    const host = new URL(url).host
    const policy = this.policy(host)
    const retries = policy.retries ?? 2
    let attempt = 0

    for (;;) {
      const started = Date.now()
      let response: Response
      try {
        response = await this.schedule(host, () =>
          this.fetchImpl(url, {
            method: options.method ?? 'GET',
            headers: { 'User-Agent': this.userAgent, Accept: 'application/json', ...options.headers },
            body: options.body,
            signal: AbortSignal.timeout(options.timeoutMs ?? policy.timeoutMs ?? 20_000),
          }),
        )
      } catch (error) {
        if (attempt < retries) {
          attempt++
          await sleep(1000 * 2 ** attempt)
          continue
        }
        const reason = error instanceof Error ? error.message : String(error)
        throw new HttpError(`Request failed: ${reason}`, 0, url)
      }

      if (response.ok) {
        const text = await response.text()
        try {
          return { status: response.status, data: JSON.parse(text) as T, durationMs: Date.now() - started, url }
        } catch {
          throw new HttpError('Response is not valid JSON', response.status, url)
        }
      }

      const retryable = response.status === 429 || response.status >= 500
      if (retryable && attempt < retries) {
        attempt++
        await response.body?.cancel()
        await sleep(retryAfterMs(response.headers.get('retry-after')) ?? 1000 * 2 ** attempt)
        continue
      }
      await response.body?.cancel()
      throw new HttpError(`HTTP ${response.status}`, response.status, url)
    }
  }
}

/** Politeness settings per host, from the sources' published guidance. */
export const HOST_POLICIES: Record<string, HostPolicy> = {
  'api.gbif.org': { minIntervalMs: 200 },
  'list.worldfloraonline.org': { minIntervalMs: 500 },
  'api.checklistbank.org': { minIntervalMs: 250 },
  // Wikidata Query Service: one query at a time, generous timeout.
  'query.wikidata.org': { minIntervalMs: 1000, timeoutMs: 60_000 },
  'query-scholarly.wikidata.org': { minIntervalMs: 1000, timeoutMs: 60_000 },
  'pubchem.ncbi.nlm.nih.gov': { minIntervalMs: 250 },
  // NCBI allows 3 req/s without a key, 10 with one; 350 ms stays safe either way.
  'eutils.ncbi.nlm.nih.gov': { minIntervalMs: 350 },
  // Europe PMC is slow and sometimes answers 503: long timeout, more retries.
  'www.ebi.ac.uk': { minIntervalMs: 1000, timeoutMs: 60_000, retries: 3 },
  'clinicaltrials.gov': { minIntervalMs: 1300 },
  // iNaturalist asks for at most ~1 request per second.
  'api.inaturalist.org': { minIntervalMs: 1100 },
  'it.wikipedia.org': { minIntervalMs: 200 },
  'commons.wikimedia.org': { minIntervalMs: 200 },
}
