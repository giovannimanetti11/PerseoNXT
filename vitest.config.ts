import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

// Unit tests import modules directly; Nuxt auto-imports are not available,
// so code under test imports its dependencies explicitly.
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '#shared': path('./shared'),
      '~': path('./app'),
    },
  },
})
