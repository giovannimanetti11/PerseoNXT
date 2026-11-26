export interface Config {
  databaseUrl: string
  host: string
  port: number
  wpGraphqlUrl: string
  ncbiApiKey: string
  adminToken: string
  userAgent: string
}

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing environment variable ${name}`)
  return value
}

export function loadConfig(): Config {
  const port = Number(process.env.PORT ?? 4010)
  if (!Number.isInteger(port) || port <= 0) throw new Error('PORT must be a positive integer')
  const contact = process.env.CONTACT_URL?.trim() || 'https://wikiherbalist.com'
  return {
    databaseUrl: required('DATABASE_URL'),
    host: process.env.HOST?.trim() || '127.0.0.1',
    port,
    wpGraphqlUrl: process.env.WP_GRAPHQL_URL?.trim() || 'https://admin.wikiherbalist.com/graphql',
    ncbiApiKey: process.env.NCBI_API_KEY?.trim() ?? '',
    adminToken: process.env.ADMIN_TOKEN?.trim() ?? '',
    userAgent: `Wikiherbalist-data/0.1 (${contact})`,
  }
}
