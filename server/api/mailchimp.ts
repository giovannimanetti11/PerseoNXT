import { apiConfig } from '@config'
import mailchimp from '@mailchimp/mailchimp_marketing'
import { defineEventHandler, readBody } from 'h3'
import type { H3Event } from 'h3'
import crypto from 'crypto'

interface RequestBody {
  email: string
  firstName: string
  lastName: string
  recaptchaToken: string
}

interface RecaptchaResponse {
  success: boolean
  score?: number
  action?: string
  hostname?: string
}

const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254

function cleanName(value: unknown): string {
  return String(value || '').replace(/[\r\n\t]/g, ' ').trim().slice(0, MAX_NAME_LENGTH)
}

function validEmail(value: string): boolean {
  return value.length > 3
    && value.length <= MAX_EMAIL_LENGTH
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!apiConfig.recaptchaSecretKey || !token) return false

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: apiConfig.recaptchaSecretKey,
      response: token,
    }),
  })

  if (!response.ok) return false
  const result: RecaptchaResponse = await response.json()
  if (!result.success) return false
  if (result.action && result.action !== 'submit') return false
  if (typeof result.score === 'number' && result.score < 0.5) return false
  if (result.hostname && !['wikiherbalist.com', 'www.wikiherbalist.com'].includes(result.hostname)) {
    return false
  }
  return true
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody<RequestBody>(event)
    const email = String(body?.email || '').trim().toLowerCase()
    const firstName = cleanName(body?.firstName)
    const lastName = cleanName(body?.lastName)

    if (!validEmail(email) || !firstName || !lastName || !body?.recaptchaToken) {
      return { success: false, message: 'Dati di iscrizione non validi' }
    }

    if (!(await verifyRecaptcha(body.recaptchaToken))) {
      return { success: false, message: 'Verifica anti-abuso non riuscita' }
    }

    if (!apiConfig.MailchimpAPIKey || !apiConfig.MailchimpServerPrefix || !apiConfig.MailchimpListID) {
      throw new Error('Mailchimp configuration incomplete')
    }

    mailchimp.setConfig({
      apiKey: apiConfig.MailchimpAPIKey,
      server: apiConfig.MailchimpServerPrefix,
    })

    const subscriberHash = crypto.createHash('md5').update(email).digest('hex')

    await mailchimp.lists.setListMember(
      apiConfig.MailchimpListID,
      subscriberHash,
      {
        email_address: email,
        // New addresses must confirm ownership by email. Existing members are updated.
        status_if_new: 'pending',
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
      }
    )

    return {
      success: true,
      status: 'pending_or_updated',
      message: 'Controlla la tua email per confermare l’iscrizione, se non eri già iscritto.',
    }
  } catch (error: any) {
    console.error('Mailchimp subscription failed:', error?.message || 'unknown error')
    return {
      success: false,
      message: 'Impossibile completare l’iscrizione in questo momento',
    }
  }
})
