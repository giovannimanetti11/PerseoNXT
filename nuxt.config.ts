const SITE_URL = 'https://wikiherbalist.com'
// Google Analytics 4 measurement ID, read at build time. Without it the GA
// scripts are not added to the page.
const GA_MEASUREMENT_ID = process.env.NUXT_PUBLIC_GA_ID || ''

const analyticsScripts = GA_MEASUREMENT_ID
  ? [
      // Consent Mode: analytics storage stays denied until the cookie banner
      // records an explicit choice (see app/components/CookieBanner.vue).
      {
        innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`,
      },
      { src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`, async: true },
    ]
  : []

// Unique per build. Client chunks keep their name when only the CSS they load
// changes, and Cloudflare serves /_nuxt/* as immutable: a reused name kept the
// previous stylesheet alive in production (26/11/2026). The build id in every
// client file name makes each deploy publish new URLs.
const BUILD_ID = Date.now().toString(36)

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },

  hooks: {
    'vite:extendConfig'(config, { isClient }) {
      if (!isClient) return
      const output = config.build?.rollupOptions?.output
      for (const options of Array.isArray(output) ? output : output ? [output] : []) {
        options.entryFileNames = `_nuxt/[hash]-${BUILD_ID}.js`
        options.chunkFileNames = `_nuxt/[hash]-${BUILD_ID}.js`
        options.assetFileNames = `_nuxt/[name].[hash]-${BUILD_ID}[extname]`
      }
    },
  },
  ssr: true,

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/robots',
    'nuxt-schema-org',
    'simple-donation',
  ],

  css: ['~/assets/css/main.css'],

  site: {
    name: 'Wikiherbalist',
    url: SITE_URL,
    defaultLocale: 'it',
  },

  app: {
    head: {
      titleTemplate: '%s | Wikiherbalist',
      htmlAttrs: { lang: 'it' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { property: 'og:site_name', content: 'Wikiherbalist' },
        { property: 'og:locale', content: 'it_IT' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: `${SITE_URL}/media/default-og-image.jpg` },
        { property: 'og:image:width', content: '1042' },
        { property: 'og:image:height', content: '596' },
        { property: 'og:image:type', content: 'image/jpeg' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${SITE_URL}/media/default-og-image.jpg` },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'alternate', hreflang: 'it', href: SITE_URL },
        { rel: 'alternate', hreflang: 'x-default', href: SITE_URL },
        { rel: 'preconnect', href: 'https://www.googletagmanager.com' },
        { rel: 'preconnect', href: 'https://zxr67682v8-dsn.algolia.net' },
        { rel: 'dns-prefetch', href: 'https://www.google-analytics.com' },
        { rel: 'dns-prefetch', href: 'https://analytics.ahrefs.com' },
      ],
      script: [
        ...analyticsScripts,
        { src: 'https://analytics.ahrefs.com/analytics.js', 'data-key': '/ZokPG3lG0QlPl7i+ZSBZg', async: true },
      ],
    },
  },

  // Values are read from the environment at build time and can be overridden
  // at runtime with the matching NUXT_* variable (e.g. NUXT_SENDGRID_API_KEY).
  runtimeConfig: {
    wpGraphqlUrl: process.env.GRAPHQL_ENDPOINT || process.env.WP_BASE_URL || 'https://admin.wikiherbalist.com/graphql',
    pubmedApiKey: process.env.PUBMED_API_KEY || '',
    // Plant data service (wikiherbalist-data), reachable only from the server.
    plantDataUrl: process.env.PLANT_DATA_URL || 'http://127.0.0.1:4010',
    algoliaAccessPassword: process.env.ALGOLIA_ACCESS_PASSWORD || '',
    algoliaAccessPasswordHash: process.env.ALGOLIA_ACCESS_PASSWORD_HASH || '',
    algoliaWriteApiKey: process.env.ALGOLIA_WRITE_API_KEY || '',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY || '',
    mailchimpApiKey: process.env.MAILCHIMP_API_KEY || '',
    mailchimpListId: process.env.MAILCHIMP_LIST_ID || '',
    mailchimpServerPrefix: process.env.MAILCHIMP_SERVER_PREFIX || 'us17',
    dbHost: process.env.DB_HOST || 'localhost',
    dbUser: process.env.DB_USER || '',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || '',
    redisPassword: process.env.REDIS_PASSWORD || '',
    public: {
      siteUrl: SITE_URL,
      recaptchaSiteKey: process.env.RECAPTCHA_PUBLIC_KEY || '',
      algolia: {
        applicationId: process.env.NUXT_PUBLIC_ALGOLIA_APP_ID || '',
        searchApiKey: process.env.NUXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '',
        indexName: 'wikiherbalist',
      },
    },
  },

  fonts: {
    families: [{ name: 'Lato', weights: [300, 400, 700, 900], provider: 'google' }],
    defaults: { styles: ['normal', 'italic'] },
  },

  image: {
    domains: ['wikiherbalist.com', 'admin.wikiherbalist.com'],
    provider: 'ipx',
    ipx: {
      modifiers: { quality: 90 },
      maxAge: 60 * 60 * 24 * 365,
    },
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'Wikiherbalist',
      url: SITE_URL,
      logo: `${SITE_URL}/media/logo.png`,
    },
  },

  simpleDonation: {
    paypal: { clientId: process.env.PAYPAL_CLIENT_ID || '' },
    colors: {
      primary: '#036297',
      secondary: '#5E9EF4',
      accent: '#0DA6A4',
      background: '#f5f5f5',
    },
  },

  build: {
    transpile: ['vue-easy-lightbox'],
  },

  nitro: {
    compressPublicAssets: true,
    routeRules: {
      '/_ipx/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
      '/algoliaUpdate': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
      '/api/**': {
        cache: false,
        headers: {
          'Access-Control-Allow-Origin': 'https://admin.wikiherbalist.com',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      },
      '/sitemap.xml': { proxy: '/api/sitemap.xml' },
      // Old admin pages, merged into /algoliaUpdate
      '/algoliaGlossaryUpdate': { redirect: { to: '/algoliaUpdate?type=glossary', statusCode: 301 } },
      '/algoliaBlogPostsUpdate': { redirect: { to: '/algoliaUpdate?type=blog', statusCode: 301 } },
    },
    prerender: {
      // WordPress answers 403 to the build crawler, so only static pages are prerendered.
      crawlLinks: false,
      routes: ['/', '/about', '/disclaimer', '/privacy-policy', '/cookie-policy', '/donazioni', '/lavora-con-noi'],
    },
  },

  typescript: {
    strict: true,
  },
})
