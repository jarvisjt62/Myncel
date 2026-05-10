import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use transaction mode pooler (port 6543) for Vercel serverless compatibility
// This prevents MaxClientsInSessionMode errors from the session mode pooler (port 5432)
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || ''

  if (!url) {
    console.error('[DB] DATABASE_URL is not set!')
    return url
  }

  try {
    // Parse the URL properly
    const parsed = new URL(url)
    const currentPort = parsed.port

    // If using session mode pooler (port 5432), switch to transaction mode (port 6543)
    if (currentPort === '5432') {
      parsed.port = '6543'

      // Ensure pgbouncer and connection_limit params are set
      parsed.searchParams.set('pgbouncer', 'true')
      parsed.searchParams.set('connection_limit', '1')

      const fixedUrl = parsed.toString()
      console.log(`[DB] Auto-switched from port 5432 → 6543 (transaction mode pooler)`)
      return fixedUrl
    }

    // If port is 6543, ensure pgbouncer params are set
    if (currentPort === '6543') {
      if (!parsed.searchParams.has('pgbouncer')) {
        parsed.searchParams.set('pgbouncer', 'true')
        parsed.searchParams.set('connection_limit', '1')
        return parsed.toString()
      }
    }

    // Already correctly configured
    return url
  } catch (e) {
    // URL parsing failed — fallback to string replacement
    console.error('[DB] URL parsing failed, using string replacement fallback:', e)

    if (url.includes(':5432/')) {
      // Strip existing query params and rebuild cleanly
      const [base] = url.split('?')
      const fixedBase = base.replace(':5432/', ':6543/')
      return `${fixedBase}?pgbouncer=true&connection_limit=1`
    }

    return url
  }
}

const dbUrl = getDatabaseUrl()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Safe query wrapper - returns defaultValue on error instead of throwing
export async function safeQuery<T>(query: Promise<T>, defaultValue?: T | null): Promise<T | null> {
  try {
    return await query;
  } catch (error) {
    console.error('[DB] Query error:', error);
    return defaultValue !== undefined ? defaultValue : null;
  }
}