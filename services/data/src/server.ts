import { buildApp } from './api/app.js'
import { loadConfig } from './config.js'
import { createDatabase } from './db/index.js'

const config = loadConfig()
const { db, close } = createDatabase(config.databaseUrl)
const app = await buildApp(db, config)

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, closing`)
  await app.close()
  await close()
  process.exit(0)
}
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

await app.listen({ host: config.host, port: config.port })
