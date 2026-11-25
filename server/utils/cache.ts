import Redis from 'ioredis'

let client: Redis | null = null

/**
 * Optional Redis cache. Every helper swallows connection errors: when Redis is
 * down the caller simply recomputes the value.
 */
function redis(): Redis {
  if (!client) {
    client = new Redis({
      host: '127.0.0.1',
      port: 6379,
      password: useRuntimeConfig().redisPassword || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    })
    client.on('error', () => {})
  }
  return client
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis().get(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis().set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    // cache is best effort
  }
}
