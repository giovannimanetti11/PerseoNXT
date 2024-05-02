import { defineNuxtConfig } from 'nuxt/config'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

export default defineNuxtConfig ({
  target: 'static',
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxt/devtools',
    'nuxt-icon',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots'
  ],
  sitemap: {
    hostname: 'https://wikiherbalist.com',
    gzip: true,
  },
  robots: {
    UserAgent: '*',
    Allow: '/',
    Disallow: '',
    Sitemap: 'https://wikiherbalist.com/sitemap.xml'
  },
  googleFonts: {
    families: {
      Lato: [300, 400, 700, 900],
    },
    display: 'swap'
  },
  css: ['~/assets/css/main.css'],
  plugins: ['~/plugins/wp-api.js'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  build: {
    extend(config, { isClient }) {
        if (isClient) {
            config.plugins.push(new BundleAnalyzerPlugin());
        }
    }
  }
});