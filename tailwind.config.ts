import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,ts}',
    './nuxt.config.ts',
  ],
  theme: {
    extend: {
      colors: {
        celeste: '#5E9EF4',
        verde: '#0DA6A4',
        blu: '#036297',
        ghiaccio: '#DFEDFD',
      },
      ringWidth: {
        '3': '3px',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  corePlugins: {
    container: false,
  },
  // Section classes are built at runtime from WordPress headings.
  safelist: [{ pattern: /post-section-.+/ }],
} satisfies Config
