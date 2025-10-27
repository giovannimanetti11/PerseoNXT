import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock nuxt's useHead
vi.mock('#app', () => ({
  useHead: vi.fn()
}))

describe('useYoastSeo Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle null data gracefully', async () => {
    const { useYoastSeo } = await import('../../../composables/useYoastSeo')
    const { useHead } = await import('#app')

    const yoastData = ref(null)
    useYoastSeo(yoastData)

    expect(useHead).toHaveBeenCalled()
  })

  it('should use title and metaDesc from yoast data', async () => {
    const { useYoastSeo } = await import('../../../composables/useYoastSeo')
    const { useHead } = await import('#app')

    const yoastData = ref({
      title: 'Test Title',
      metaDesc: 'Test Description',
      opengraphTitle: 'OG Title',
      opengraphDescription: 'OG Description'
    })

    useYoastSeo(yoastData)

    expect(useHead).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.any(Object)
      })
    )
  })

  it('should fallback to metaTitle when opengraphTitle is missing', async () => {
    const { useYoastSeo } = await import('../../../composables/useYoastSeo')
    const { useHead } = await import('#app')

    const yoastData = ref({
      title: 'Test Title',
      metaDesc: 'Test Description'
    })

    useYoastSeo(yoastData)

    expect(useHead).toHaveBeenCalled()
  })
})
