export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Provide simpleDonation config for the component
  if (!config.public.simpleDonation) {
    config.public.simpleDonation = {
      paypal: {
        clientId: config.public.paypalClientId || process.env.PAYPAL_CLIENT_ID || ''
      },
      colors: {
        primary: '#036297',
        secondary: '#5E9EF4',
        accent: '#0DA6A4',
        background: '#f5f5f5'
      }
    }
  }
})
