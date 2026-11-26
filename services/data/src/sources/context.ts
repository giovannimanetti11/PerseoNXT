import { HttpClient, HttpError, type RequestOptions } from '../http/client.js'
import type { SourceId } from '../types.js'

/** Receives every raw response and every failure, so runs can be audited and re-normalized. */
export interface Recorder {
  payload(entry: { source: SourceId; plantSlug: string; requestKey: string; url: string; status: number; durationMs: number; body: unknown }): Promise<void>
  failure(entry: { source: SourceId; plantSlug: string; requestKey: string; url: string; status: number; message: string }): Promise<void>
}

export const nullRecorder: Recorder = {
  payload: async () => {},
  failure: async () => {},
}

export interface SourceContext {
  plantSlug: string
  ncbiApiKey: string
  /** Fetches JSON and records it; rethrows HttpError after recording the failure. */
  get<T>(source: SourceId, requestKey: string, url: string, options?: RequestOptions): Promise<T>
}

const SECRET_PARAMS = ['api_key', 'apikey', 'key', 'token']

/** URLs are stored and shown in /v1/errors: credentials never leave the process. */
export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url)
    for (const name of SECRET_PARAMS) if (parsed.searchParams.has(name)) parsed.searchParams.set(name, 'REDACTED')
    return parsed.toString()
  } catch {
    return url
  }
}

export function createContext(http: HttpClient, recorder: Recorder, plantSlug: string, ncbiApiKey = ''): SourceContext {
  return {
    plantSlug,
    ncbiApiKey,
    async get<T>(source: SourceId, requestKey: string, url: string, options: RequestOptions = {}): Promise<T> {
      try {
        const result = await http.json<T>(url, options)
        await recorder.payload({ source, plantSlug, requestKey, url: redactUrl(result.url), status: result.status, durationMs: result.durationMs, body: result.data })
        return result.data
      } catch (error) {
        const status = error instanceof HttpError ? error.status : 0
        const failedUrl = redactUrl(error instanceof HttpError ? error.url : url)
        const message = error instanceof Error ? error.message : String(error)
        await recorder.failure({ source, plantSlug, requestKey, url: failedUrl, status, message })
        throw error
      }
    },
  }
}
