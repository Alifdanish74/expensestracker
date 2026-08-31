import 'server-only'
import { PrismaClient } from '@/generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  pool: Pool | undefined
  prisma: InstanceType<typeof PrismaClient> | undefined
}

function createPrismaClient(): InstanceType<typeof PrismaClient> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined')
  }

  // Reuse existing pool if available on globalThis to prevent pool leakage during Next.js HMR
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString,
      max: 5, // Strict limit for Supabase session mode (max 15 pool size)
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: connectionString.includes('supabase.co') || connectionString.includes('sslmode=')
        ? { rejectUnauthorized: false }
        : undefined,
    })

  const adapter = new PrismaPg(pool)
  const prismaInstance = new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool
    globalForPrisma.prisma = prismaInstance
  }

  return prismaInstance
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()
