// Legge le variabili d'ambiente (disponibili grazie a Nuxt)
export const apiConfig = {
  // WordPress
  baseUrl: process.env.WP_BASE_URL || 'https://admin.wikiherbalist.com/graphql',
  appPassword: process.env.WP_APP_PASSWORD,
  username: process.env.WP_USERNAME,

  // PubMed
  pubMedApiKey: process.env.PUBMED_API_KEY,

  // Amazon Polly
  amazonPollyAccess: process.env.AMAZON_POLLY_ACCESS_KEY,
  amazonPollySecret: process.env.AMAZON_POLLY_SECRET_KEY,

  // Algolia
  algoliaAccessPassword: process.env.ALGOLIA_ACCESS_PASSWORD,
  algoliaUpdateCooldown: 5 * 60 * 1000, // Non sensibile
  algoliaAppId: process.env.NUXT_PUBLIC_ALGOLIA_APP_ID,
  algoliaSearchAPIKey: process.env.NUXT_PUBLIC_ALGOLIA_SEARCH_API_KEY,
  algoliaWriteAPIKey: process.env.ALGOLIA_WRITE_API_KEY,
  algoliaAdminAPIKey: process.env.ALGOLIA_ADMIN_API_KEY,
  algoliaUsageAPIKey: process.env.ALGOLIA_USAGE_API_KEY,
  algoliaMonitoringAPIKey: process.env.ALGOLIA_MONITORING_API_KEY,

  // SendGrid
  sendGridApiKey: process.env.SENDGRID_API_KEY,

  // reCAPTCHA
  recaptchaPublicKey: process.env.RECAPTCHA_PUBLIC_KEY,
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,

  // Mailchimp
  MailchimpAPIKey: process.env.MAILCHIMP_API_KEY,
  MailchimpListID: process.env.MAILCHIMP_LIST_ID,
  MailchimpServerPrefix: process.env.MAILCHIMP_SERVER_PREFIX || 'us17',

  // Database
  dbHost: process.env.DB_HOST || 'localhost',
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,

  // Site Info (valori pubblici, non sensibili)
  name: 'WikiHerbalist',
  url: 'https://wikiherbalist.com',
  description: 'Enciclopedia di erbe aromatiche e medicinali'
};
