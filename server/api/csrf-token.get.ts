export default defineEventHandler((event) => ({ token: issueCsrfToken(event) }))
