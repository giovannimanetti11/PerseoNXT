import type { FormResponse } from '#shared/types/api'

interface ContactRequest {
  nome?: unknown
  cognome?: unknown
  email?: unknown
  telefono?: unknown
  richiesta?: unknown
  recaptchaToken?: unknown
}

/** Contact form on the homepage. Name, surname and phone are optional. */
export default defineEventHandler(async (event): Promise<FormResponse> => {
  const body = await readBody<ContactRequest>(event)
  const nome = cleanField(body?.nome, 100)
  const cognome = cleanField(body?.cognome, 100)
  const email = cleanField(body?.email, 254)
  const telefono = cleanField(body?.telefono, 40)
  const richiesta = cleanText(body?.richiesta)

  if (!isValidEmail(email) || !richiesta) {
    return { success: false, message: 'Indica un indirizzo email valido e il testo della richiesta.' }
  }
  if (!(await verifyRecaptcha(event, body?.recaptchaToken))) {
    return { success: false, message: 'Verifica anti-spam non riuscita. Ricarica la pagina e riprova.' }
  }

  try {
    await sendSiteMail(event, 'Nuova richiesta dal modulo contatti di Wikiherbalist.com', [
      ['Nome', nome || '-'],
      ['Cognome', cognome || '-'],
      ['Email', email],
      ['Telefono', telefono || '-'],
      ['Richiesta', richiesta],
    ], email)
    return { success: true, message: 'Richiesta inviata. Risponderemo il prima possibile.' }
  } catch (error) {
    console.error('[sendEmail] delivery failed:', error instanceof Error ? error.message : error)
    return { success: false, message: "Non è stato possibile inviare la richiesta. Riprova più tardi o scrivi a info@wikiherbalist.com." }
  }
})
