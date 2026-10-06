import { timingSafeEqual, createHash } from 'crypto'
import bcrypt from 'bcryptjs'

// In-memory rate limiter (per IP)
interface RateLimitEntry {
  count: number
  firstAttempt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry) return { allowed: true }

  // Reset window if expired
  if (now - entry.firstAttempt > WINDOW_MS) {
    rateLimitStore.delete(ip)
    return { allowed: true }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - entry.firstAttempt)) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  return { allowed: true }
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, firstAttempt: now })
  } else {
    entry.count++
  }
}

export function clearRateLimit(ip: string): void {
  rateLimitStore.delete(ip)
}

export function auditLog(action: string, ip: string, success: boolean, detail?: string): void {
  const ts = new Date().toISOString()
  const level = success ? 'INFO' : 'WARN'
  const msg = `[AUDIT][${level}] ${ts} | ${action} | ip=${ip} | success=${success}${detail ? ` | ${detail}` : ''}`
  if (success) {
    console.log(msg)
  } else {
    console.warn(msg)
  }
}

/**
 * Verifica la password admin supportando sia bcrypt hash che confronto timing-safe.
 * Se ALGOLIA_ACCESS_PASSWORD_HASH e' presente nell'env, usa bcrypt.
 * Altrimenti usa timingSafeEqual sul plaintext (per retrocompatibilita').
 */
export async function verifyAdminPassword(provided: string, storedHash?: string | null, storedPlain?: string | null): Promise<boolean> {
  if (!provided) return false

  if (storedHash) {
    return bcrypt.compare(provided, storedHash)
  }

  if (storedPlain) {
    // Timing-safe comparison to prevent timing attacks
    const a = Buffer.from(createHash('sha256').update(provided).digest('hex'))
    const b = Buffer.from(createHash('sha256').update(storedPlain).digest('hex'))
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  }

  return false
}
