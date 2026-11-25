import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import bcrypt from 'bcryptjs'

/** Client IP as seen by nginx (first X-Forwarded-For hop), max 45 chars. */
export function clientIp(event: H3Event): string {
  return (getRequestIP(event, { xForwardedFor: true }) ?? 'unknown').slice(0, 45)
}

// ---------------------------------------------------------------------------
// In-memory rate limiting. The app runs as a single PM2 fork, so a process
// local Map is enough; it resets on restart.
// ---------------------------------------------------------------------------

interface Window {
  count: number
  startedAt: number
}

export function createRateLimiter(maxAttempts: number, windowMs: number) {
  const windows = new Map<string, Window>()

  const current = (key: string, now: number): Window | undefined => {
    const entry = windows.get(key)
    if (entry && now - entry.startedAt > windowMs) {
      windows.delete(key)
      return undefined
    }
    return entry
  }

  return {
    /** Seconds to wait, or 0 when another attempt is allowed. */
    retryAfter(key: string): number {
      const now = Date.now()
      const entry = current(key, now)
      if (!entry || entry.count < maxAttempts) return 0
      return Math.ceil((windowMs - (now - entry.startedAt)) / 1000)
    },
    hit(key: string): void {
      const now = Date.now()
      const entry = current(key, now)
      if (entry) entry.count += 1
      else windows.set(key, { count: 1, startedAt: now })
    },
    reset(key: string): void {
      windows.delete(key)
    },
  }
}

// ---------------------------------------------------------------------------
// reCAPTCHA v3
// ---------------------------------------------------------------------------

interface RecaptchaVerification {
  success: boolean
  score?: number
  action?: string
  hostname?: string
}

const RECAPTCHA_HOSTS = new Set(['wikiherbalist.com', 'www.wikiherbalist.com'])
const RECAPTCHA_MIN_SCORE = 0.5

export async function verifyRecaptcha(event: H3Event, token: unknown): Promise<boolean> {
  const secret = useRuntimeConfig(event).recaptchaSecretKey
  if (!secret) {
    console.error('[recaptcha] RECAPTCHA_SECRET_KEY is not configured')
    return false
  }
  if (typeof token !== 'string' || !token) return false

  try {
    const result = await $fetch<RecaptchaVerification>('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
      timeout: 10_000,
    })
    return result.success
      && (!result.action || result.action === 'submit')
      && (typeof result.score !== 'number' || result.score >= RECAPTCHA_MIN_SCORE)
      && (!result.hostname || RECAPTCHA_HOSTS.has(result.hostname))
  } catch (error) {
    console.error('[recaptcha] verification request failed:', error instanceof Error ? error.message : error)
    return false
  }
}

// ---------------------------------------------------------------------------
// One-time CSRF tokens for the feedback widget. The token travels in the body,
// its lookup key in an httpOnly SameSite=Strict cookie.
// ---------------------------------------------------------------------------

const CSRF_COOKIE = 'csrf_key'
const CSRF_TTL_MS = 30 * 60 * 1000
const csrfTokens = new Map<string, { token: string; issuedAt: number }>()

function purgeExpiredTokens(now: number): void {
  for (const [key, value] of csrfTokens) {
    if (now - value.issuedAt > CSRF_TTL_MS) csrfTokens.delete(key)
  }
}

export function issueCsrfToken(event: H3Event): string {
  const now = Date.now()
  purgeExpiredTokens(now)
  const key = randomBytes(32).toString('hex')
  const token = randomBytes(32).toString('hex')
  csrfTokens.set(key, { token, issuedAt: now })
  setCookie(event, CSRF_COOKIE, key, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'strict',
    maxAge: CSRF_TTL_MS / 1000,
    path: '/',
  })
  return token
}

/** Validates and consumes the token. */
export function consumeCsrfToken(event: H3Event, provided: unknown): boolean {
  const key = getCookie(event, CSRF_COOKIE)
  if (!key || typeof provided !== 'string') return false
  const stored = csrfTokens.get(key)
  csrfTokens.delete(key)
  if (!stored || Date.now() - stored.issuedAt > CSRF_TTL_MS) return false
  return safeEqual(stored.token, provided)
}

// ---------------------------------------------------------------------------
// Admin password for the Algolia sync page
// ---------------------------------------------------------------------------

function safeEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

/** Uses the bcrypt hash when configured, the plain password otherwise. */
export async function verifyAdminPassword(event: H3Event, provided: unknown): Promise<boolean> {
  if (typeof provided !== 'string' || !provided) return false
  const config = useRuntimeConfig(event)
  if (config.algoliaAccessPasswordHash) return bcrypt.compare(provided, config.algoliaAccessPasswordHash)
  if (config.algoliaAccessPassword) return safeEqual(provided, config.algoliaAccessPassword)
  return false
}

export function auditLog(action: string, ip: string, success: boolean, detail?: string): void {
  const line = `[audit] ${new Date().toISOString()} ${action} ip=${ip} success=${success}${detail ? ` ${detail}` : ''}`
  if (success) console.log(line)
  else console.warn(line)
}
