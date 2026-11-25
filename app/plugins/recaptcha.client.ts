/**
 * reCAPTCHA v3 for the public forms. The Google script is loaded on the first
 * user interaction (or on the first execute call) instead of on page load.
 */
export default defineNuxtPlugin(() => {
  const siteKey = useRuntimeConfig().public.recaptchaSiteKey
  let loader: Promise<ReCaptchaV3> | null = null

  const load = (): Promise<ReCaptchaV3> => {
    loader ??= new Promise<ReCaptchaV3>((resolve, reject) => {
      if (!siteKey) {
        reject(new Error('reCAPTCHA site key is not configured'))
        return
      }
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
      script.async = true
      script.onload = () => {
        const grecaptcha = window.grecaptcha
        if (grecaptcha) grecaptcha.ready(() => resolve(grecaptcha))
        else reject(new Error('reCAPTCHA did not initialise'))
      }
      script.onerror = () => reject(new Error('reCAPTCHA script failed to load'))
      document.head.appendChild(script)
    })
    return loader
  }

  const preload = () => { load().catch(() => {}) }
  for (const type of ['pointermove', 'touchstart', 'scroll', 'keydown'] as const) {
    window.addEventListener(type, preload, { once: true, passive: true })
  }

  return {
    provide: {
      recaptcha: {
        async execute(action: string): Promise<string> {
          const grecaptcha = await load()
          return grecaptcha.execute(siteKey, { action })
        },
      },
    },
  }
})
