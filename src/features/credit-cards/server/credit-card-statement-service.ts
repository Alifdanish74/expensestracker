import 'server-only'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import {
  creditCardStatementSchema,
  type CreditCardStatementInput,
} from '../schemas/credit-card-statement-schema'
import { getCreditCardById } from './credit-card-service'
import { Prisma } from '@/generated/prisma/client'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/**
 * Parses a YYYY-MM-DD string into a UTC midnight Date object
 * to prevent timezone drift when writing to a PostgreSQL @db.Date column.
 */
function parseDateStringToUTC(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  return new Date(Date.UTC(year, month - 1, day))
}

/**
 * Retrieves statement history for a given credit card account.
 * Scoped strictly to authenticated user and verified account.
 */
export async function getCardStatements(accountId: string) {
  const userId = await getAuthenticatedUserId()

  // Verify account ownership
  const card = await getCreditCardById(accountId)
  if (!card) return []

  return prisma.creditCardStatement.findMany({
    where: {
      userId,
      accountId,
    },
    orderBy: [
      { statementYear: 'desc' },
      { statementMonth: 'desc' },
    ],
  })
}

/**
 * Retrieves the latest recorded statement snapshot for a card.
 */
export async function getLatestStatement(accountId: string) {
  const userId = await getAuthenticatedUserId()

  const card = await getCreditCardById(accountId)
  if (!card) return null

  return prisma.creditCardStatement.findFirst({
    where: {
      userId,
      accountId,
    },
    orderBy: [
      { statementYear: 'desc' },
      { statementMonth: 'desc' },
    ],
  })
}

/**
 * Retrieves a single statement record by statementId and accountId,
 * verifying ownership.
 */
export async function getStatementById(accountId: string, statementId: string) {
  const userId = await getAuthenticatedUserId()

  const statement = await prisma.creditCardStatement.findFirst({
    where: {
      id: statementId,
      userId,
      accountId,
    },
    include: {
      account: true,
    },
  })

  if (!statement || statement.account.type !== 'CREDIT_CARD') {
    return null
  }

  return statement
}

/**
 * Creates a new historical CreditCardStatement.
 * Verifies account ownership and handles duplicate statement period collisions.
 * MUST NOT modify Account.currentBalance or create financial transactions.
 */
export async function createCreditCardStatement(
  accountId: string,
  input: CreditCardStatementInput
) {
  const userId = await getAuthenticatedUserId()

  const card = await getCreditCardById(accountId)
  if (!card) {
    throw new Error('Credit card account not found or access denied')
  }

  const validated = creditCardStatementSchema.safeParse(input)
  if (!validated.success) {
    const firstError = validated.error.issues[0]
    throw new Error(firstError?.message ?? 'Invalid statement data')
  }

  const data = validated.data
  const statementDate = parseDateStringToUTC(data.statementDate)
  const dueDate = parseDateStringToUTC(data.dueDate)

  try {
    return await prisma.creditCardStatement.create({
      data: {
        userId,
        accountId: card.id,
        statementYear: data.statementYear,
        statementMonth: data.statementMonth,
        statementDate,
        dueDate,
        statementBalance: new Prisma.Decimal(data.statementBalance),
        minimumPayment:
          data.minimumPayment && data.minimumPayment.trim() !== ''
            ? new Prisma.Decimal(data.minimumPayment)
            : null,
        notes: data.notes?.trim() || null,
      },
    })
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      const monthName = MONTH_NAMES[data.statementMonth - 1] || 'selected month'
      throw new Error(
        `A statement for ${monthName} ${data.statementYear} already exists for this card.`
      )
    }
    throw err
  }
}

/**
 * Updates an existing CreditCardStatement snapshot.
 */
export async function updateCreditCardStatement(
  accountId: string,
  statementId: string,
  input: CreditCardStatementInput
) {
  // Auth guard: fail fast if session is invalid before hitting DB
  await getAuthenticatedUserId()

  const existing = await getStatementById(accountId, statementId)
  if (!existing) {
    throw new Error('Statement not found or access denied')
  }

  const validated = creditCardStatementSchema.safeParse(input)
  if (!validated.success) {
    const firstError = validated.error.issues[0]
    throw new Error(firstError?.message ?? 'Invalid statement data')
  }

  const data = validated.data
  const statementDate = parseDateStringToUTC(data.statementDate)
  const dueDate = parseDateStringToUTC(data.dueDate)

  try {
    return await prisma.creditCardStatement.update({
      where: { id: statementId },
      data: {
        statementYear: data.statementYear,
        statementMonth: data.statementMonth,
        statementDate,
        dueDate,
        statementBalance: new Prisma.Decimal(data.statementBalance),
        minimumPayment:
          data.minimumPayment && data.minimumPayment.trim() !== ''
            ? new Prisma.Decimal(data.minimumPayment)
            : null,
        notes: data.notes?.trim() || null,
      },
    })
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      const monthName = MONTH_NAMES[data.statementMonth - 1] || 'selected month'
      throw new Error(
        `A statement for ${monthName} ${data.statementYear} already exists for this card.`
      )
    }
    throw err
  }
}

/**
 * Deletes a CreditCardStatement record.
 * Verifies statement ownership before deletion.
 */
export async function deleteCreditCardStatement(
  accountId: string,
  statementId: string
) {
  // Auth guard: fail fast if session is invalid before hitting DB
  await getAuthenticatedUserId()

  const existing = await getStatementById(accountId, statementId)
  if (!existing) {
    throw new Error('Statement not found or access denied')
  }

  return prisma.creditCardStatement.delete({
    where: { id: statementId },
  })
}
