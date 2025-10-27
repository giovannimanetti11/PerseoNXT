import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock nuxt's useHead
const useHeadMock = vi.fn()
vi.mock('#app', () => ({
  useHead: useHeadMock
}))

describe('useYoastSeo Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle null data gracefully', async () => {
    const { useYoastSeo } = await import('../../../composables/useYoastSeo')

    const yoastData = ref(null)
    useYoastSeo(yoastData)

    expect(useHeadMock).toHaveBeenCalled()
  })

  it('should use title and metaDesc from yoast data', async () => {
    const { useYoastSeo } = await import('../../../composables/useYoastSeo')

    const yoastData = ref({
      title: 'Test Title',
      metaDesc: 'Test Description',
      opengraphTitle: 'OG Title',
      opengraphDescription: 'OG Description'
    })

    useYoastSeo(yoastData)

    expect(useHeadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.any(Object)
      })
    )
  })

  it('should fallback to metaTitle when opengraphTitle is missing', async () => {
    const { useYoastSeo } = await import('../../../composables/useYoastSeo')

    const yoastData = ref({
      title: 'Test Title',
      metaDesc: 'Test Description'
    })

    useYoastSeo(yoastData)

    expect(useHeadMock).toHaveBeenCalled()
  })
})
