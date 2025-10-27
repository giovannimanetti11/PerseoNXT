import { vi } from 'vitest'

export const useHead = vi.fn()
export const useRoute = vi.fn(() => ({
  path: '/',
  fullPath: '/',
  params: {},
  query: {},
  name: 'index'
}))
export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn()
}))
export const useRuntimeConfig = vi.fn(() => ({}))
export const useNuxtApp = vi.fn(() => ({}))
export const useAsyncData = vi.fn()
export const createError = vi.fn((error) => error)
export const defineNuxtPlugin = vi.fn((plugin) => plugin)
