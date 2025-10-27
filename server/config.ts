import type { H3Event } from 'h3'

/**
 * Get API configuration for server-side routes
 * Uses Nuxt's runtimeConfig for secure environment variable access
 */
export function useApiConfig(event: H3Event) {
  const config = useRuntimeConfig(event)

  return {
    // WordPress
    baseUrl: config.wpBaseUrl,
    username: config.wpUsername,
    appPassword: config.wpAppPassword,

    // PubMed
    pubMedApiKey: config.pubMedApiKey,

    // Amazon Polly
    amazonPollyAccess: config.amazonPollyAccess,
    amazonPollySecret: config.amazonPollySecret,

    // Algolia
    algoliaAccessPassword: config.algoliaAccessPassword,
    algoliaUpdateCooldown: 5 * 60 * 1000,
    algoliaAppId: config.public.algolia.applicationId,
    algoliaSearchAPIKey: config.public.algolia.apiKey,
    algoliaWriteAPIKey: config.algoliaWriteApiKey,
    algoliaAdminAPIKey: config.algoliaAdminApiKey,
    algoliaUsageAPIKey: config.algoliaUsageApiKey,
    algoliaMonitoringAPIKey: config.algoliaMonitoringApiKey,

    // SendGrid
    sendGridApiKey: config.sendGridApiKey,

    // reCAPTCHA
    recaptchaPublicKey: config.public.recaptchaPublicKey,
    recaptchaSecretKey: config.recaptchaSecretKey,

    // Mailchimp
    MailchimpAPIKey: config.mailchimpApiKey,
    MailchimpListID: config.mailchimpListId,
    MailchimpServerPrefix: config.mailchimpServerPrefix,

    // Database
    dbHost: config.dbHost,
    dbUser: config.dbUser,
    dbPassword: config.dbPassword,
    dbName: config.dbName,

    // Site Info
    name: 'WikiHerbalist',
    url: 'https://wikiherbalist.com',
    description: 'Enciclopedia di erbe aromatiche e medicinali'
  }
}
