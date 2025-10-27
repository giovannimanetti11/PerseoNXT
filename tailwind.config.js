/** @type {import('tailwindcss').Config} */

module.exports = {
    content: [
      './components/**/*.{js,vue,ts}',
      './layouts/**/*.vue',
      './pages/**/*.vue',
      './plugins/**/*.{js,ts}',
      './nuxt.config.{js,ts}',
      './app.vue',
      './error.vue',
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
    // Optimize production build
    corePlugins: {
      // Disable unused Tailwind features
      preflight: true, // Keep for base styles
      container: false, // Not used
      float: true, // Used in slideshow component
    },
    // Safelist only dynamic classes that can't be detected by PurgeCSS
    safelist: [
      // Section-specific classes generated dynamically
      {
        pattern: /post-section-.+/,
        variants: [],
      },
      {
        pattern: /blogpost-section-.+/,
        variants: [],
      },
      {
        pattern: /term-section-.+/,
        variants: [],
      },
      // Slideshow responsive margin classes
      'm-auto',
      'md:ml-auto',
      'md:mr-0',
      'md:float-right',
      'justify-center',
      'md:justify-end'
    ],
    plugins: [],
  };