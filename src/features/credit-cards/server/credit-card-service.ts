import 'server-only'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'

/**
 * Retrieves all active credit card accounts for the authenticated user.
 * Scoped strictly to userId + type = CREDIT_CARD + active = true.
 */
export async function getCreditCards() {
  const userId = await getAuthenticatedUserId()

  return prisma.account.findMany({
    where: {
      userId,
      type: 'CREDIT_CARD',
      active: true,
    },
    orderBy: [
      { institutionName: 'asc' },
      { name: 'asc' },
    ],
  })
}

/**
 * Retrieves a single active credit card account, verifying ownership and card type.
 * Returns null if missing, owned by another user, non-credit-card, or archived.
 */
export async function getCreditCardById(accountId: string) {
  const userId = await getAuthenticatedUserId()

  return prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
      type: 'CREDIT_CARD',
      active: true,
    },
  })
}

/**
 * Retrieves recent CARD_PAYMENT transactions made to this credit card.
 * Scoped strictly to userId + type = CARD_PAYMENT + destinationAccountId = accountId.
 */
export async function getRecentCardPayments(accountId: string) {
  const userId = await getAuthenticatedUserId()

  const raw = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'CARD_PAYMENT',
      destinationAccountId: accountId,
    },
    include: {
      account: { select: { id: true, name: true, institutionName: true } },
    },
    orderBy: [
      { transactionDate: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 5,
  })

  return raw.map((t) => ({
    id: t.id,
    description: t.description,
    amount: t.amount.toString(),
    transactionDate: t.transactionDate.toISOString().slice(0, 10),
    sourceAccount: t.account,
  }))
}
