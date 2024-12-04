import { defineNuxtConfig } from 'nuxt/config'

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
    url: 'https://wikiherbalist.com',
    baseURL: '/'
  },

  // Application head configuration
  app: {
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
        { property: 'og:site_name', content: 'Wikiherbalist' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        // CSS preload configuration
        { 
          rel: 'preload',
          href: '/css/main.css',
          as: 'style',
          type: 'text/css'
        },
        // Main CSS load
        {
          rel: 'stylesheet',
          href: '/css/main.css',
          type: 'text/css'
        }
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
      ]
    },
  },

  // Runtime configuration
  runtimeConfig: {
    public: {
      siteName: 'Wikiherbalist'
    }
  },

  // Modules configuration
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    'nuxt-icon',
    '@nuxt/image',
    '@nuxtjs/seo',
    "nuxt-schema-org",
    '~/modules/simple-donation'
  ],

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
    '~/plugins/wp-api.ts',
    '~/plugins/algolia.ts',
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
    '@config': '$DEPLOY_PATH/config.js',
  },

  // Build configuration
  build: {
    transpile: ['vue-easy-lightbox'],
    standalone: true,
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
        },
        layouts: true,
        pages: true,
        commons: true
      },
    },
    extend(config: any, ctx: any) {
      if (ctx.isDev) {
        config.devtool = ctx.isClient ? 'source-map' : 'inline-source-map'
      }
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
      include: ['vue', 'vue-router', '@vueuse/core'],
    },
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            if (id.includes('@nuxtjs/tailwindcss')) {
              return 'tailwind';
            }
          },
        },
      },
    },
    css: {
      preprocessorOptions: {
        css: {
          additionalData: '@import "@/assets/css/main.css";'
        }
      }
    }
  },

  // SEO configuration
  seo: {
    baseUrl: 'https://wikiherbalist.com',
    name: 'Wikiherbalist',
    title: 'Enciclopedia di erbe aromatiche e medicinali',
    description: 'Enciclopedia online di erbe aromatiche e medicinali. Scopri proprietà, usi e benefici delle piante.',
    sitemap: {
      hostname: 'https://wikiherbalist.com',
      routes: async () => {
        const { data } = await $fetch('/api/sitemap-urls');
        return data;
      },
    },
  },

  // Nitro server configuration
nitro: {
  compressPublicAssets: true,
  // Prerender configuration
  prerender: {
    crawlLinks: true,
    routes: [
      '/',
      '/about',
      '/piante-medicinali',
      '/glossario',
      '/blog',
      '/disclaimer',
      '/privacy-policy',
      '/cookie-policy',
      '/donazioni',
      '/css/main.css'
    ]
  },
  // Route rules
  routeRules: {
    // CSS handling
    '/algoliaUpdate': {
      ssr: false
    },
    '/css/**': {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
      }
    },
    // Static pages
    '/': { static: true },
    '/about': { static: true },
    '/piante-medicinali': { static: true },
    '/glossario': { static: true },
    '/blog': { static: true },
    '/disclaimer': { static: true },
    '/privacy-policy': { static: true },
    '/cookie-policy': { static: true },
    '/donazioni': { static: true },
    // Global security headers and rules
    '/**': { 
      headers: {
        'Content-Security-Policy': `
          default-src 'self';
          script-src 'self' 'unsafe-inline' https://www.google-analytics.com https://www.googletagmanager.com https://www.google.com https://www.gstatic.com https://*.google.com;
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
          font-src 'self' https://fonts.gstatic.com;
          img-src 'self' data: https://www.google-analytics.com https://admin.wikiherbalist.com https://tile.openstreetmap.org;
          connect-src 'self' https://www.google-analytics.com https://admin.wikiherbalist.com https://region1.google-analytics.com https://api.gbif.org https://eutils.ncbi.nlm.nih.gov https://*.google.com;
          frame-src 'self' https://www.google.com https://*.google.com;
          object-src 'none';
        `.replace(/\s+/g, ' ').trim()
      }
    }
  }
},

  // Hooks configuration
  hooks: {
    'nitro:config': (config) => {
      // Ensure prerender configuration exists
      config.prerender = config.prerender || {}
      config.prerender.routes = config.prerender.routes || []
      
      // Add additional routes to prerender
      const additionalRoutes = [
        '/about',
        '/piante-medicinali',
        '/glossario',
        '/blog',
        '/disclaimer',
        '/privacy-policy',
        '/cookie-policy',
        '/donazioni'
      ]
      config.prerender.routes.push(...additionalRoutes)
    },
    'build:before': () => {
      // Additional build configurations can be added here
    },
    'render:setupMiddleware'(app) {
      app.use(compression());
    }
  },

  // Experimental features
  experimental: {
    payloadExtraction: true,
    inlineSSRStyles: false
  },

  // Compatibility date
  compatibilityDate: '2024-08-14'
});