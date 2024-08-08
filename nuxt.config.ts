import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({

  // Configure image domains and modifiers for image handling
  image: {
    domains: ['wikinutritionals.com'],
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

  // Enable server-side rendering
  ssr: true,
  nitro: {
    prerender: {
      crawlLinks: true, // Allow automatic crawling of links for pre-rendering
      routes: ['/'] // Define routes to pre-render
    },
    compressPublicAssets: true,
  },
  site: {
    url: 'https://wikiherbalist.com',
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'it',
      },
      title: 'Wikiherbalist - Enciclopedia di erbe aromatiche e medicinali',
      titleTemplate: '%s - Wikiherbalist',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'Wikiherbalist è un\'enciclopedia online dedicata alle erbe aromatiche e medicinali. Scopri proprietà, usi e benefici delle piante.' },
        { name: 'format-detection', content: 'telephone=no' },
        { hid: 'og:type', property: 'og:type', content: 'website' },
        { hid: 'og:title', property: 'og:title', content: 'Wikiherbalist - Enciclopedia di erbe aromatiche e medicinali' },
        { hid: 'og:description', property: 'og:description', content: 'Scopri proprietà, usi e benefici delle piante medicinali su Wikiherbalist.' },
        { hid: 'og:image', property: 'og:image', content: '/media/og-image.jpg' },
        { hid: 'og:url', property: 'og:url', content: 'https://wikiherbalist.com' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://wikiherbalist.com' },
      ],
    },
  },
  target: 'static', // Set deployment target to static hosting
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxt/devtools',
    'nuxt-icon',
    '@nuxtjs/sitemap',
    '@nuxt/image',
    '@nuxtjs/seo',
  ],
  sitemap: {
    hostname: 'https://wikiherbalist.com',
    gzip: true,
  },
  robots: {
    UserAgent: '*',
    Allow: '/',
    Disallow: '',
    Sitemap: 'https://wikiherbalist.com/sitemap.xml',
  },
  googleFonts: {
    families: {
      Lato: [300, 400, 700, 900],
    },
    display: 'swap',
    preload: true,
    preconnect: true,
    useStylesheet: true,
  },
  css: ['~/assets/css/main.css'],
  plugins: [
    '~/plugins/wp-api.js', // Wordpress API integration
    '~/plugins/algolia.js', // Algolia search integration
  ],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  alias: {
    '@config': '/var/www/wikinutritionals.com/config.js',
  },
  build: {
    transpile: ['vue-easy-lightbox'],
    optimization: {
      splitChunks: {
        chunks: 'all',
        automaticNameDelimiter: '.',
        name: undefined,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
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
  },
  vite: {
    optimizeDeps: {
      include: ['vue', 'vue-router', '@vueuse/core'],
    },
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
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
  },
  seo: {
    baseUrl: 'https://wikiherbalist.com',
    name: 'Wikiherbalist',
    templateTitle: '%s - Wikiherbalist',
    description: 'Enciclopedia online di erbe aromatiche e medicinali. Scopri proprietà, usi e benefici delle piante.',
  },
});
