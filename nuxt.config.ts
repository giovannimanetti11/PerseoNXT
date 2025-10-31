import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  // Image handling configuration
  image: {
    domains: ['wikiherbalist.com', 'admin.wikiherbalist.com'],
    alias: {
      media: '/media',
    },
    provider: 'ipx',
    ipx: {
      modifiers: {
        format: ['webp', 'jpg', 'png'],
        quality: 90,
        fit: 'cover',
      },
      maxAge: 60 * 60 * 24 * 365
    }
  },

  // Server configuration
  ssr: true,

  // Site and URL configuration
  site: {
    name: 'Wikiherbalist',
    url: 'https://wikiherbalist.com',
    baseURL: '/'
  },

  // Application head configuration
  app: {
    name: 'Wikiherbalist',
    baseURL: '/',
    head: {
      titleTemplate: '%s | Wikiherbalist',
      htmlAttrs: {
        lang: 'it',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { property: 'og:site_name', content: 'Wikiherbalist' },
        { property: 'og:locale', content: 'it_IT' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:type', content: 'image/jpeg' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
      script: [
        {
          src: 'https://www.googletagmanager.com/gtag/js?id=G-GZ4J8CZ4CW',
          async: true
        },
        {
          innerHTML: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GZ4J8CZ4CW');
          `,
          type: 'text/javascript'
        },
        {
          src: 'https://analytics.ahrefs.com/analytics.js',
          'data-key': '/ZokPG3lG0QlPl7i+ZSBZg',
          async: true
        },
      ]
    },
  },

  // Runtime configuration
  runtimeConfig: {
    // Private keys - only available server-side
    wpBaseUrl: process.env.WP_BASE_URL || 'https://admin.wikiherbalist.com/graphql',
    wpUsername: process.env.WP_USERNAME,
    wpAppPassword: process.env.WP_APP_PASSWORD,
    pubMedApiKey: process.env.PUBMED_API_KEY,
    amazonPollyAccess: process.env.AMAZON_POLLY_ACCESS_KEY,
    amazonPollySecret: process.env.AMAZON_POLLY_SECRET_KEY,
    algoliaAccessPassword: process.env.ALGOLIA_ACCESS_PASSWORD,
    algoliaWriteApiKey: process.env.ALGOLIA_WRITE_API_KEY,
    algoliaAdminApiKey: process.env.ALGOLIA_ADMIN_API_KEY,
    algoliaUsageApiKey: process.env.ALGOLIA_USAGE_API_KEY,
    algoliaMonitoringApiKey: process.env.ALGOLIA_MONITORING_API_KEY,
    sendGridApiKey: process.env.SENDGRID_API_KEY,
    recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
    mailchimpApiKey: process.env.MAILCHIMP_API_KEY,
    mailchimpListId: process.env.MAILCHIMP_LIST_ID,
    mailchimpServerPrefix: process.env.MAILCHIMP_SERVER_PREFIX || 'us17',
    dbHost: process.env.DB_HOST || 'localhost',
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,

    // Public keys - available on both client and server
    public: {
      siteName: 'Wikiherbalist',
      recaptchaPublicKey: process.env.RECAPTCHA_PUBLIC_KEY,
      algolia: {
        applicationId: process.env.NUXT_PUBLIC_ALGOLIA_APP_ID,
        apiKey: process.env.NUXT_PUBLIC_ALGOLIA_SEARCH_API_KEY,
        indexName: 'wikiherbalist'
      }
    }
  },

  // Modules configuration
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/seo',
    "nuxt-schema-org",
    // 'simple-donation', // Temporarily disabled - incompatible with Nuxt 4
    '@nuxtjs/algolia'
  ],

  // Schema.org configuration
  schemaOrg: {
    host: 'https://wikiherbalist.com',
    siteName: 'Wikiherbalist',
    canonicalHost: 'https://wikiherbalist.com'
  },

  algolia: {
    apiKey: process.env.NUXT_PUBLIC_ALGOLIA_SEARCH_API_KEY,
    applicationId: process.env.NUXT_PUBLIC_ALGOLIA_APP_ID,
    lite: true,
    search: true,
    indexName: 'wikiherbalist'
  },

  // Simple donation module configuration
  simpleDonation: {
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID
    },
    colors: {
      primary: '#036297',
      secondary: '#5E9EF4',
      accent: '#0DA6A4',
      background: '#f5f5f5'
    },
  },

  // Robots.txt configuration
  robots: {
    UserAgent: '*',
    Allow: '/',
    Disallow: '',
    Sitemap: 'https://wikiherbalist.com/sitemap.xml',
  },

  // Google Fonts configuration
  googleFonts: {
    families: {
      Lato: [300, 400, 700, 900],
    },
    display: 'swap',
    preload: true,
    preconnect: true,
    useStylesheet: true,
    download: true,
    base64: false,
  },

  // CSS configuration
  css: ['~/assets/css/main.css'],

  // Plugins configuration
  plugins: [
    // Apollo plugin removed - using native useGraphQL composable instead
  ],

  // PostCSS configuration
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
      ...(process.env.NODE_ENV === 'production' ? {
        cssnano: {
          preset: ['default', {
            discardComments: {
              removeAll: true,
            },
            normalizeWhitespace: true,
            minifyFontValues: true,
            minifyGradients: true,
          }]
        }
      } : {})
    },
  },

  // Aliases configuration
  alias: {
    '@config': fileURLToPath(new URL('./config.js', import.meta.url)),
  },

  // Build configuration
  build: {
    transpile: ['vue-easy-lightbox'],
    analyze: false,
    extractCSS: true,
    optimizeCSS: true,
    optimization: {
      splitChunks: {
        chunks: 'all',
        automaticNameDelimiter: '.',
        name: undefined,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module: { context: string }): string {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
              return `npm.${packageName.replace('@', '')}`;
            },
          },
        }
      }
    },
  },

  // Router configuration (Nuxt 4 compatible)
  router: {
    options: {
      strict: false
    }
  },

  // Vite configuration
  vite: {
    server: {
      hmr: {
        protocol: 'ws',
        host: 'localhost'
      }
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', '@vueuse/core']
    }
  },

  // Disable module-generated static sitemap; use dynamic API endpoint instead
  sitemap: {
    enabled: false
  },

  // SEO configuration
  seo: {
    baseUrl: 'https://wikiherbalist.com',
    name: 'Wikiherbalist',
    title: 'Enciclopedia di erbe aromatiche e medicinali',
    description: 'Enciclopedia online di erbe aromatiche e medicinali. Scopri proprietà, usi e benefici delle piante.',
  },

  // Link checker configuration
  linkChecker: {
    enabled: false, // Disable link checker during build to avoid localhost errors
  },

  // Nitro server configuration
  nitro: {
    compressPublicAssets: true,
    routeRules: {
      // Homepage static
      '/': { static: true },

      // ISR: Cache SSR pages with Stale-While-Revalidate
      '/**': {
        swr: 3600  // 1 hour: serve cached, update in background
      },

      // Content pages: longer cache + SEO headers
      '/piante-medicinali/**': {
        swr: 7200,  // 2 hours
        headers: {
          'X-Robots-Tag': 'index, follow',
          'Cache-Control': 'public, max-age=3600, s-maxage=7200'
        }
      },
      '/blog/**': {
        swr: 7200,
        headers: {
          'X-Robots-Tag': 'index, follow',
          'Cache-Control': 'public, max-age=3600, s-maxage=7200'
        }
      },
      '/glossario/**': {
        swr: 7200,
        headers: {
          'X-Robots-Tag': 'index, follow',
          'Cache-Control': 'public, max-age=3600, s-maxage=7200'
        }
      },

      // Static pages: 24h cache
      '/disclaimer': { swr: 86400 },
      '/privacy-policy': { swr: 86400 },
      '/cookie-policy': { swr: 86400 },
      // '/donazioni': { swr: 86400 },  // Disabled temporarily
      '/about': { swr: 86400 },

      // API routes: no cache + CORS headers for admin.wikiherbalist.com
      '/api/**': {
        cache: false,
        headers: {
          'Access-Control-Allow-Origin': 'https://admin.wikiherbalist.com',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      },
      '/sitemap.xml': {
        proxy: '/api/sitemap.xml',
        cache: false
      },
    },
    prerender: {
      crawlLinks: false, // Disable crawling to avoid 403 errors from WordPress during build
      ignore: [
        '/_ipx/**',
        '/api/**',
        '/_ipx/f_webp**',
        '/sitemap.xml'
      ],
      routes: [
        '/',
        '/about',
        '/disclaimer',
        '/privacy-policy',
        '/cookie-policy'
        // '/donazioni'  // Disabled temporarily
      ]
    }
  },

  // Future flags for Nuxt 4 compatibility
  future: {
    compatibilityVersion: 4
  },

  // Compatibility date
  compatibilityDate: '2024-11-01'
});