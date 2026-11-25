type GtagCommand =
  | ['consent', 'default' | 'update', Record<string, 'granted' | 'denied'>]
  | ['event', string, Record<string, string | number | boolean>]

declare global {
  interface ReCaptchaV3 {
    ready(callback: () => void): void
    execute(siteKey: string, options: { action: string }): Promise<string>
  }

  interface Window {
    grecaptcha?: ReCaptchaV3
    gtag?: (...args: GtagCommand) => void
  }
}

export {}
