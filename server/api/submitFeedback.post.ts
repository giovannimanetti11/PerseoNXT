import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import mysql from 'mysql2/promise'
import type { ResultSetHeader } from 'mysql2'
import type { FormResponse } from '#shared/types/api'

interface FeedbackRequest {
  url?: unknown
  feedback?: unknown
  comment?: unknown
  device?: unknown
  csrfToken?: unknown
}

const limiter = createRateLimiter(5, 15 * 60 * 1000)
const DEVICES = new Set(['desktop', 'tablet', 'mobile'])
let pool: mysql.Pool | null = null

function database(event: Parameters<typeof useRuntimeConfig>[0]): mysql.Pool {
  if (!pool) {
    const config = useRuntimeConfig(event)
    pool = mysql.createPool({
      host: config.dbHost,
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName,
      connectionLimit: 2,
    })
  }
  return pool
}

async function logSuspicious(ip: string, userAgent: string, reason: string, input: string, patterns: string[] = []) {
  const entry = {
    timestamp: new Date().toISOString(),
    ip,
    userAgent: userAgent.slice(0, 200),
    reason,
    detectedPatterns: patterns,
    input: input.slice(0, 500),
  }
  try {
    const dir = join(process.cwd(), 'logs')
    await mkdir(dir, { recursive: true })
    await appendFile(join(dir, 'security.log'), `${JSON.stringify(entry)}\n`)
  } catch (error) {
    console.error('[feedback] cannot write security.log:', error instanceof Error ? error.message : error)
  }
}

/** The WordPress plugin that lists feedback prints these columns without escaping. */
function escapeForStorage(value: string): string {
  return escapeHtml(value).replace(/\//g, '&#x2F;')
}

/** "Trovi utile questa pagina?" widget. Rows go to the wh_perseo_feedback table. */
export default defineEventHandler(async (event): Promise<FormResponse> => {
  const ip = clientIp(event)
  const userAgent = cleanField(getHeader(event, 'user-agent'), 500)

  if (limiter.retryAfter(ip) > 0) {
    await logSuspicious(ip, userAgent, 'rate_limit_exceeded', '')
    return { success: false, message: 'Troppi invii. Riprova tra qualche minuto.' }
  }
  limiter.hit(ip)

  const body = await readBody<FeedbackRequest>(event)
  if (!consumeCsrfToken(event, body?.csrfToken)) {
    await logSuspicious(ip, userAgent, 'invalid_csrf_token', '')
    return { success: false, message: 'Sessione scaduta. Ricarica la pagina e riprova.' }
  }

  const feedback = body?.feedback
  if (feedback !== 'yes' && feedback !== 'no') {
    await logSuspicious(ip, userAgent, 'invalid_feedback_value', String(feedback))
    return { success: false, message: 'Risposta non valida.' }
  }

  const comment = cleanField(body?.comment, 1000)
  const check = checkFeedbackComment(comment)
  if (!check.ok) {
    if (check.reason !== 'too_long') await logSuspicious(ip, userAgent, check.reason, comment, check.patterns)
    return { success: false, message: FEEDBACK_COMMENT_MESSAGES[check.reason] }
  }

  const path = cleanField(body?.url, 500)
  if (!path.startsWith('/')) return { success: false, message: 'Pagina non valida.' }
  const device = typeof body?.device === 'string' && DEVICES.has(body.device) ? body.device : 'desktop'

  try {
    const [result] = await database(event).execute<ResultSetHeader>(
      'INSERT INTO wh_perseo_feedback (url, time, feedback, comment, device, user_agent, ip) VALUES (?, NOW(), ?, ?, ?, ?, ?)',
      [
        new URL(path, 'https://www.wikiherbalist.com').href,
        feedback,
        escapeForStorage(comment),
        device,
        escapeForStorage(userAgent),
        ip,
      ],
    )
    if (result.affectedRows !== 1) throw new Error(`unexpected affectedRows ${result.affectedRows}`)
    return { success: true, message: 'Grazie per il feedback.' }
  } catch (error) {
    console.error('[feedback] insert failed:', error instanceof Error ? error.message : error)
    return { success: false, message: 'Feedback non salvato. Riprova più tardi.' }
  }
})
