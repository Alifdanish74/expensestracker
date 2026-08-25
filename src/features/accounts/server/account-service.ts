import 'server-only'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import { accountSchema, toAccountData, type AccountFormValues } from '../schemas/account-schema'

/**
 * Retrieves all active accounts for the authenticated user.
 * Scoped to the authenticated user ID — never returns another user's data.
 */
export async function getAccounts() {
  const userId = await getAuthenticatedUserId()

  return prisma.account.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Retrieves a single active account, verifying it belongs to the authenticated user.
 * Returns null if not found, archived, or owned by another user — no information leakage.
 */
export async function getAccountById(id: string) {
  const userId = await getAuthenticatedUserId()

  return prisma.account.findFirst({
    where: { id, userId, active: true },
  })
}

/**
 * Creates a new account for the authenticated user.
 * userId is derived server-side — never accepted from browser input.
 */
export async function createAccount(input: AccountFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = accountSchema.safeParse(input)
  if (!validated.success) {
    const firstError = validated.error.issues[0]
    throw new Error(firstError?.message ?? 'Invalid account data')
  }

  const data = toAccountData(validated.data)

  return prisma.account.create({
    data: {
      ...data,
      userId,
    },
  })
}

/**
 * Updates an existing account, verifying ownership before mutation.
 * userId is derived server-side — re-checked during update to prevent IDOR.
 */
export async function updateAccount(id: string, input: AccountFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = accountSchema.safeParse(input)
  if (!validated.success) {
    const firstError = validated.error.issues[0]
    throw new Error(firstError?.message ?? 'Invalid account data')
  }

  // Verify ownership: use findFirst with both id + userId
  const existing = await prisma.account.findFirst({
    where: { id, userId, active: true },
  })
  if (!existing) {
    throw new Error('Account not found or access denied')
  }

  const data = toAccountData(validated.data)

  return prisma.account.update({
    where: { id },
    data,
    // userId is intentionally not included — ownership is immutable
  })
}

/**
 * Archives (soft-deletes) an account by setting active=false.
 * Verifies ownership before mutation.
 */
export async function archiveAccount(id: string) {
  const userId = await getAuthenticatedUserId()

  const existing = await prisma.account.findFirst({
    where: { id, userId, active: true },
  })
  if (!existing) {
    throw new Error('Account not found or access denied')
  }

  return prisma.account.update({
    where: { id },
    data: { active: false },
  })
}
