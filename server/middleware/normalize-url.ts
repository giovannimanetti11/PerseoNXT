export default defineEventHandler((event) => {
  const path = event.path || getRequestURL(event).pathname

  // Fix double slashes in path (e.g. //glossario/droga -> /glossario/droga)
  if (path.includes('//')) {
    const queryIndex = path.indexOf('?')
    const pathname = queryIndex >= 0 ? path.slice(0, queryIndex) : path
    const query = queryIndex >= 0 ? path.slice(queryIndex) : ''
    const cleanPath = pathname.replace(/\/\/+/g, '/') + query
    return sendRedirect(event, cleanPath, 301)
  }
})
