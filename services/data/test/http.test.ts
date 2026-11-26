import { describe, expect, it } from 'vitest'
import { HttpClient, HttpError, buildUrl } from '../src/http/client.js'
import { createContext, redactUrl, type Recorder } from '../src/sources/context.js'

function fakeFetch(responses: (() => Response)[]): { fetch: typeof fetch; calls: string[] } {
  const calls: string[] = []
  let index = 0
  const fn: typeof fetch = async (input) => {
    calls.push(String(input))
    const next = responses[Math.min(index++, responses.length - 1)]
    if (!next) throw new Error('no response')
    return next()
  }
  return { fetch: fn, calls }
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => () =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

describe('HttpClient', () => {
  it('builds query strings and skips undefined values', () => {
    expect(buildUrl('https://a.test/x', { q: 'Zingiber officinale', page: undefined, n: 2 })).toBe('https://a.test/x?q=Zingiber+officinale&n=2')
  })

  it('retries 429 honouring Retry-After, then succeeds', async () => {
    const { fetch, calls } = fakeFetch([json({}, 429, { 'retry-after': '0' }), json({ ok: true })])
    const client = new HttpClient('test', { 'a.test': { minIntervalMs: 0, retries: 2 } }, fetch)
    const result = await client.json<{ ok: boolean }>('https://a.test/x')
    expect(result.data.ok).toBe(true)
    expect(calls).toHaveLength(2)
  })

  it('does not retry client errors', async () => {
    const { fetch, calls } = fakeFetch([json({}, 404)])
    const client = new HttpClient('test', { 'a.test': { minIntervalMs: 0 } }, fetch)
    await expect(client.json('https://a.test/x')).rejects.toMatchObject({ status: 404 })
    expect(calls).toHaveLength(1)
  })

  it('rejects invalid JSON with an HttpError', async () => {
    const { fetch } = fakeFetch([() => new Response('<html>', { status: 200 })])
    const client = new HttpClient('test', { 'a.test': { minIntervalMs: 0 } }, fetch)
    await expect(client.json('https://a.test/x')).rejects.toBeInstanceOf(HttpError)
  })

  it('spaces requests to the same host', async () => {
    const { fetch } = fakeFetch([json({})])
    const client = new HttpClient('test', { 'a.test': { minIntervalMs: 60 } }, fetch)
    const started = Date.now()
    await Promise.all([client.json('https://a.test/1'), client.json('https://a.test/2'), client.json('https://a.test/3')])
    expect(Date.now() - started).toBeGreaterThanOrEqual(110)
  })
})

describe('recording', () => {
  it('never stores API keys', async () => {
    expect(redactUrl('https://eutils.test/esearch?term=x&api_key=SECRET')).toBe('https://eutils.test/esearch?term=x&api_key=REDACTED')
    const stored: string[] = []
    const recorder: Recorder = {
      payload: async (entry) => { stored.push(entry.url) },
      failure: async (entry) => { stored.push(entry.url) },
    }
    const { fetch } = fakeFetch([json({ ok: 1 }), json({}, 400)])
    const ctx = createContext(new HttpClient('test', { 'a.test': { minIntervalMs: 0 } }, fetch), recorder, 'zingiber-officinale', 'SECRET')
    await ctx.get('pubmed', 'count', 'https://a.test/x', { query: { api_key: 'SECRET' } })
    await expect(ctx.get('pubmed', 'count', 'https://a.test/y', { query: { api_key: 'SECRET' } })).rejects.toBeInstanceOf(HttpError)
    expect(stored).toHaveLength(2)
    expect(stored.join(' ')).not.toContain('SECRET')
  })
})
