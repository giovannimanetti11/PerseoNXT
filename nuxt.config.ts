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
      }
    }
  },

  // Server configuration
  ssr: true,
  target: 'server',

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
    public: {
      siteName: 'Wikiherbalist',
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
    'simple-donation',
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
    '~/plugins/wp-api.ts'
  ],

  // PostCSS configuration
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
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

  // Router configuration
  router: {
    options: {
      strict: false
    },
    extendRoutes(routes, resolve) {
      const staticPages = [
        { name: 'disclaimer', path: '/disclaimer' },
        { name: 'privacy-policy', path: '/privacy-policy' },
        { name: 'cookie-policy', path: '/cookie-policy' },
        { name: 'donazioni', path: '/donazioni' }
      ]

      // Add static pages to routes with higher priority
      staticPages.forEach(page => {
        routes.unshift({
          name: page.name,
          path: page.path,
          component: resolve(__dirname, 'pages/' + page.name + '.vue')
        })
      })
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
      '/': { static: true },
      '/sitemap.xml': {
        proxy: '/api/sitemap.xml',
        cache: false
      },
      '/api/sitemap.xml': {
        cache: false
      }
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
        '/cookie-policy',
        '/donazioni'
      ]
    }
  },

  // Experimental features
  experimental: {
    payloadExtraction: true,
    inlineSSRStyles: true,
    renderJsonPayloads: true
  },

  // Compatibility date
  compatibilityDate: '2024-08-14'
});