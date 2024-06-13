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
          blu: '#036297',
          ghiaccio: '#DFEDFD',
          'scrollbar-bg': '#f5f5f5',
          'scrollbar-thumb-bg': 'rgba(224,237,253,1)'
        },
        ringWidth: {
          '1': '1px',
          '2': '2px',
          '3': '3px',
        }
      },
      borderWidth: {
        DEFAULT: '1px',
        '0': '0',
        '2': '2px',
        '3': '3px',
        '4': '4px'
      }
    },
    plugins: [
    ],
  };