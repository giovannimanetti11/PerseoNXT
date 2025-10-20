export default defineNuxtPlugin((nuxtApp) => {
    const route = useRoute()
    const baseUrl = 'https://wikiherbalist.com'
  
    // Helper function to clean and normalize URLs
    const normalizeUrl = (url: string): string => {
      // Remove trailing slashes except for homepage
      if (url !== baseUrl && url.endsWith('/')) {
        url = url.slice(0, -1)
      }
      return url
    }
  
    // Watch route changes to update canonical
    watch(() => route.fullPath, () => {
      let url = `${baseUrl}${route.path}`
      
      // Special handling for dynamic routes
      if (route.name === '[...uri]') {
        const uri = Array.isArray(route.params.uri) 
          ? route.params.uri.join('/') 
          : route.params.uri
        url = `${baseUrl}/${uri}`
      }
  
      const normalizedUrl = normalizeUrl(url)
  
      // Update canonical link
      useHead({
        link: [
          {
            rel: 'canonical',
            href: normalizedUrl
          }
        ]
      })
    }, { immediate: true })
  })