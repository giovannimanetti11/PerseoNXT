/** @type {import('tailwindcss').Config} */

const colors = require('tailwindcss/colors');

module.exports = {
    content: [
      './components/**/*.{js,vue,ts}',
      './layouts/**/*.vue',
      './pages/**/*.vue',
      './plugins/**/*.{js,ts}',
      './nuxt.config.{js,ts}',
      './app.vue',
    ],
    theme: {
      extend: {
        colors: {
          celeste: '#5E9EF4',
          verde: '#0DA6A4',
          blu: '#036297'
        }
      },
    },
    plugins: [
    ],
  };