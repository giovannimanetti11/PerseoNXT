import type { FormResponse } from '#shared/types/api'

/**
 * Posts a public form with a fresh reCAPTCHA token and normalizes the outcome:
 * the endpoints always answer `{ success, message }`, network failures become
 * an unsuccessful response with a generic message.
 */
export function useRecaptchaSubmit(endpoint: string) {
  const { $recaptcha } = useNuxtApp()
  const pending = ref(false)

  const submit = async (payload: Record<string, string>): Promise<FormResponse> => {
    pending.value = true
    try {
      const recaptchaToken = await $recaptcha.execute('submit')
      return await $fetch<FormResponse>(endpoint, { method: 'POST', body: { ...payload, recaptchaToken } })
    } catch (error) {
      console.error(`[${endpoint}]`, error)
      return { success: false, message: 'Invio non riuscito. Controlla la connessione e riprova.' }
    } finally {
      pending.value = false
    }
  }

  return { submit, pending }
}
