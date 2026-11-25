import type { FormResponse } from '#shared/types/api'

interface ProposalRequest {
  postUrl?: unknown
  nome?: unknown
  cognome?: unknown
  email?: unknown
  titoloStudio?: unknown
  affiliazione?: unknown
  section?: unknown
  proposal?: unknown
  reason?: unknown
  recaptchaToken?: unknown
}

/** "Proponi una modifica" form on monographs and blog posts. */
export default defineEventHandler(async (event): Promise<FormResponse> => {
  const body = await readBody<ProposalRequest>(event)
  const postUrl = cleanField(body?.postUrl, 300)
  const nome = cleanField(body?.nome, 100)
  const cognome = cleanField(body?.cognome, 100)
  const email = cleanField(body?.email, 254)
  const titoloStudio = cleanField(body?.titoloStudio, 200)
  const affiliazione = cleanField(body?.affiliazione, 200)
  const section = cleanField(body?.section, 200)
  const proposal = cleanText(body?.proposal)
  const reason = cleanText(body?.reason, 2000)

  if (!postUrl.startsWith('/') || !nome || !cognome || !isValidEmail(email) || !section || !proposal || !reason) {
    return { success: false, message: 'Compila nome, cognome, email, sezione, proposta e motivazione.' }
  }
  if (!(await verifyRecaptcha(event, body?.recaptchaToken))) {
    return { success: false, message: 'Verifica anti-spam non riuscita. Ricarica la pagina e riprova.' }
  }

  try {
    await sendSiteMail(event, 'Nuova proposta di modifica per Wikiherbalist', [
      ['Pagina', `https://wikiherbalist.com${postUrl}`],
      ['Nome', nome],
      ['Cognome', cognome],
      ['Email', email],
      ['Titolo di studio', titoloStudio || '-'],
      ['Affiliazione', affiliazione || '-'],
      ['Sezione', section],
      ['Proposta', proposal],
      ['Motivazione', reason],
    ], email)
    return { success: true, message: 'Proposta inviata. Grazie per il contributo.' }
  } catch (error) {
    console.error('[sendProposal] delivery failed:', error instanceof Error ? error.message : error)
    return { success: false, message: 'Non è stato possibile inviare la proposta. Riprova più tardi.' }
  }
})
