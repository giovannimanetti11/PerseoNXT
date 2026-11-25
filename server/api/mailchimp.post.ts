import { createHash } from 'node:crypto'
import type { FormResponse } from '#shared/types/api'

interface SubscribeRequest {
  email?: unknown
  firstName?: unknown
  lastName?: unknown
  recaptchaToken?: unknown
}

/**
 * Newsletter signup. New addresses get status "pending" so Mailchimp sends the
 * double opt-in email; existing members only have their names updated.
 */
export default defineEventHandler(async (event): Promise<FormResponse> => {
  const body = await readBody<SubscribeRequest>(event)
  const email = cleanField(body?.email, 254).toLowerCase()
  const firstName = cleanField(body?.firstName, 100)
  const lastName = cleanField(body?.lastName, 100)

  if (!isValidEmail(email) || !firstName || !lastName) {
    return { success: false, message: 'Inserisci email, nome e cognome.' }
  }
  if (!(await verifyRecaptcha(event, body?.recaptchaToken))) {
    return { success: false, message: 'Verifica anti-spam non riuscita. Ricarica la pagina e riprova.' }
  }

  const { mailchimpApiKey, mailchimpListId, mailchimpServerPrefix } = useRuntimeConfig(event)
  if (!mailchimpApiKey || !mailchimpListId || !mailchimpServerPrefix) {
    console.error('[mailchimp] configuration incomplete')
    return { success: false, message: 'Iscrizione non disponibile in questo momento.' }
  }

  const subscriberHash = createHash('md5').update(email).digest('hex')
  try {
    await $fetch(`https://${mailchimpServerPrefix}.api.mailchimp.com/3.0/lists/${mailchimpListId}/members/${subscriberHash}`, {
      method: 'PUT',
      headers: { Authorization: `Basic ${Buffer.from(`wikiherbalist:${mailchimpApiKey}`).toString('base64')}` },
      body: {
        email_address: email,
        status_if_new: 'pending',
        merge_fields: { FNAME: firstName, LNAME: lastName },
      },
      timeout: 15_000,
    })
    return { success: true, message: 'Ti abbiamo inviato una email: apri il link per confermare l’iscrizione.' }
  } catch (error) {
    console.error('[mailchimp] subscription failed:', error instanceof Error ? error.message : error)
    return { success: false, message: 'Iscrizione non riuscita. Riprova più tardi.' }
  }
})
