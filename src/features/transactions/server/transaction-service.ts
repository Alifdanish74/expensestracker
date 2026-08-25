import 'server-only'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import { expenseSchema, type ExpenseFormValues } from '../schemas/expense-schema'
import { incomeSchema, type IncomeFormValues } from '../schemas/income-schema'
import { transferSchema, type TransferFormValues } from '../schemas/transfer-schema'
import { cardPaymentSchema, type CardPaymentFormValues } from '../schemas/card-payment-schema'
import { refundSchema, type RefundFormValues } from '../schemas/refund-schema'

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Parses a YYYY-MM-DD string into a Date representing midnight UTC on that
 * calendar date. Storing as midnight UTC avoids timezone shifts when the
 * PostgreSQL @db.Date column is read back.
 */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!))
}

/**
 * Returns start (inclusive) and end (exclusive) UTC boundaries for a given
 * calendar month so we can filter @db.Date columns correctly.
 */
export function getMonthBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))
  return { start, end }
}

/**
 * Parses a "YYYY-MM" string into { year, month } numbers.
 * Returns null if the string is invalid or out of range.
 */
export function parseMonthParam(monthStr: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr)
  if (!match) return null
  const year = parseInt(match[1]!, 10)
  const month = parseInt(match[2]!, 10)
  if (year < 2000 || year > 2100) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TransactionWithRelations {
  id: string
  type: string
  amount: string        // serialised Decimal → string for safe RSC→Client passing
  description: string
  transactionDate: string // ISO date string YYYY-MM-DD
  essential: boolean
  notes: string | null
  merchant: string | null
  account: { id: string; name: string; institutionName: string | null }
  category: { id: string; name: string } | null
  destinationAccount: { id: string; name: string; institutionName: string | null } | null
  /** For EXPENSE: the original expense detail for this refund. */
  relatedTransaction: {
    id: string
    description: string
    amount: string
    transactionDate: string
    category: { id: string; name: string } | null
  } | null
  /** For EXPENSE: sum of all linked refund amounts (serialised). */
  refundTotal: string
}

export interface TransactionFilters {
  /** YYYY-MM format. Falls back to current month if invalid. */
  month: string
  /** Case-insensitive description search. Trimmed. Ignored if empty. */
  search?: string
  /** Account UUID. Matches accountId OR destinationAccountId. */
  accountId?: string
  /** Category UUID. Matches EXPENSE categoryId or REFUND's original expense categoryId. */
  categoryId?: string
  /** TransactionType enum value. Empty = all types. */
  type?: string
}

export interface TransactionsResult {
  transactions: TransactionWithRelations[]
  /** Sum of EXPENSE transactions for the filtered result set */
  grossExpenses: string
  /** Sum of REFUND transactions for the filtered result set */
  refundTotal: string
  /** grossExpenses - refundTotal */
  netRecordedSpending: string
  /** Sum of INCOME transactions for the filtered result set */
  incomeReceived: string
  /** Sum of TRANSFER transactions for the filtered result set */
  transferTotal: string
  /** Sum of CARD_PAYMENT transactions for the filtered result set */
  cardPaymentTotal: string
  /** True when any filter (search/account/category/type) is active */
  isFiltered: boolean
  /** Resolved YYYY-MM string for the displayed month */
  resolvedMonth: string
}

export interface MonthlyTransactionsResult {
  transactions: TransactionWithRelations[]
  /** Sum of EXPENSE transactions for the month, serialised as string */
  totalExpenses: string
}

// ── Expense creation ──────────────────────────────────────────────────────────

/**
 * Creates an EXPENSE transaction.
 * - userId derived server-side from the authenticated Supabase session.
 * - Account and Category ownership verified before write.
 */
export async function createExpense(input: ExpenseFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = expenseSchema.safeParse(input)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid expense data')
  }

  const { amount, description, categoryId, accountId, transactionDate, essential, notes } =
    validated.data

  const trimmedDescription = description.trim()
  const trimmedNotes = notes && notes.trim() !== '' ? notes.trim() : null

  // Verify account belongs to authenticated user and is active
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId, active: true },
    select: { id: true },
  })
  if (!account) {
    throw new Error('Account not found or access denied')
  }

  // Verify category belongs to authenticated user and is active
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId, active: true },
    select: { id: true },
  })
  if (!category) {
    throw new Error('Category not found or access denied')
  }

  return prisma.transaction.create({
    data: {
      userId,
      accountId,
      categoryId,
      destinationAccountId: null,
      relatedTransactionId: null,
      type: 'EXPENSE',
      amount: parseFloat(amount),
      description: trimmedDescription,
      transactionDate: parseDateString(transactionDate),
      essential,
      notes: trimmedNotes,
    },
  })
}

// ── Income creation ───────────────────────────────────────────────────────────

/**
 * Creates an INCOME transaction.
 * - Account must be active and NOT a CREDIT_CARD.
 * - Does NOT update Account.currentBalance or Profile.monthlyNetIncome.
 */
export async function createIncomeTransaction(input: IncomeFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = incomeSchema.safeParse(input)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid income data')
  }

  const { amount, description, accountId, transactionDate, notes } = validated.data

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId, active: true },
    select: { id: true, type: true },
  })
  if (!account) throw new Error('Account not found or access denied')
  if (account.type === 'CREDIT_CARD') {
    throw new Error('Income cannot be recorded to a credit card account. Use a Refund for credit card credits.')
  }

  return prisma.transaction.create({
    data: {
      userId,
      accountId,
      categoryId: null,
      destinationAccountId: null,
      relatedTransactionId: null,
      type: 'INCOME',
      amount: parseFloat(amount),
      description: description.trim(),
      transactionDate: parseDateString(transactionDate),
      essential: false,
      notes: notes?.trim() || null,
    },
  })
}

// ── Transfer creation ─────────────────────────────────────────────────────────

/**
 * Creates a TRANSFER transaction (one record, two accounts).
 * - Both accounts must be active, owned by the user, and non-CREDIT_CARD.
 * - Source ≠ destination.
 * - Does NOT update Account.currentBalance.
 */
export async function createTransferTransaction(input: TransferFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = transferSchema.safeParse(input)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid transfer data')
  }

  const { amount, description, accountId, destinationAccountId, transactionDate, notes } =
    validated.data

  if (accountId === destinationAccountId) {
    throw new Error('Source and destination accounts must be different')
  }

  const [source, destination] = await Promise.all([
    prisma.account.findFirst({
      where: { id: accountId, userId, active: true },
      select: { id: true, type: true },
    }),
    prisma.account.findFirst({
      where: { id: destinationAccountId, userId, active: true },
      select: { id: true, type: true },
    }),
  ])

  if (!source) throw new Error('Source account not found or access denied')
  if (!destination) throw new Error('Destination account not found or access denied')
  if (source.type === 'CREDIT_CARD') {
    throw new Error('Credit card accounts cannot be used as a transfer source. Use Card Payment for payments to a credit card.')
  }
  if (destination.type === 'CREDIT_CARD') {
    throw new Error('Credit card accounts cannot be used as a transfer destination. Use Card Payment for payments to a credit card.')
  }

  return prisma.transaction.create({
    data: {
      userId,
      accountId,
      destinationAccountId,
      categoryId: null,
      relatedTransactionId: null,
      type: 'TRANSFER',
      amount: parseFloat(amount),
      description: description.trim(),
      transactionDate: parseDateString(transactionDate),
      essential: false,
      notes: notes?.trim() || null,
    },
  })
}

// ── Card Payment creation ─────────────────────────────────────────────────────

/**
 * Creates a CARD_PAYMENT transaction.
 * - Source must be active, owned, NOT CREDIT_CARD.
 * - Destination must be active, owned, and MUST be CREDIT_CARD.
 * - Does NOT settle any CreditCardStatement.
 * - Does NOT update Account.currentBalance.
 */
export async function createCardPaymentTransaction(input: CardPaymentFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = cardPaymentSchema.safeParse(input)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid card payment data')
  }

  const { amount, description, accountId, destinationAccountId, transactionDate, notes } =
    validated.data

  if (accountId === destinationAccountId) {
    throw new Error('Source and destination accounts must be different')
  }

  const [source, destination] = await Promise.all([
    prisma.account.findFirst({
      where: { id: accountId, userId, active: true },
      select: { id: true, type: true },
    }),
    prisma.account.findFirst({
      where: { id: destinationAccountId, userId, active: true },
      select: { id: true, type: true },
    }),
  ])

  if (!source) throw new Error('Source account not found or access denied')
  if (source.type === 'CREDIT_CARD') {
    throw new Error('The payment source cannot be a credit card account.')
  }
  if (!destination) throw new Error('Credit card account not found or access denied')
  if (destination.type !== 'CREDIT_CARD') {
    throw new Error('The destination must be a credit card account.')
  }

  return prisma.transaction.create({
    data: {
      userId,
      accountId,
      destinationAccountId,
      categoryId: null,
      relatedTransactionId: null,
      type: 'CARD_PAYMENT',
      amount: parseFloat(amount),
      description: description.trim(),
      transactionDate: parseDateString(transactionDate),
      essential: false,
      notes: notes?.trim() || null,
    },
  })
}

// ── Refund creation (concurrency-safe) ───────────────────────────────────────

/**
 * Creates a REFUND transaction, linked to an original EXPENSE.
 *
 * Concurrency safety: uses a Prisma $transaction with SELECT … FOR UPDATE
 * to lock the original expense row before summing existing refunds and
 * inserting the new refund. This prevents two simultaneous refund submissions
 * from both passing the cumulative-limit check on stale data.
 *
 * - Category is derived from the original EXPENSE — NOT selected by user.
 * - Does NOT modify the original Expense amount.
 * - Does NOT update Account.currentBalance.
 */
export async function createRefundTransaction(input: RefundFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = refundSchema.safeParse(input)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid refund data')
  }

  const { amount, description, accountId, relatedTransactionId, transactionDate, notes } =
    validated.data

  const refundAmount = parseFloat(amount)

  // Verify receiving account
  const receivingAccount = await prisma.account.findFirst({
    where: { id: accountId, userId, active: true },
    select: { id: true },
  })
  if (!receivingAccount) throw new Error('Receiving account not found or access denied')

  // Concurrency-safe transaction with row-level lock
  return prisma.$transaction(async (tx) => {
    // Lock the original expense row to prevent concurrent refund over-submission
    await tx.$executeRaw`
      SELECT id FROM transactions WHERE id = ${relatedTransactionId}::uuid FOR UPDATE
    `

    // Re-read with ownership + type verification inside the transaction
    const expense = await tx.transaction.findFirst({
      where: { id: relatedTransactionId, userId, type: 'EXPENSE' },
      select: { id: true, amount: true },
    })

    if (!expense) {
      throw new Error('Original expense not found or access denied')
    }

    // Sum existing refunds for this expense (inside the locked transaction)
    const existingRefunds = await tx.transaction.aggregate({
      where: { relatedTransactionId: expense.id, type: 'REFUND' },
      _sum: { amount: true },
    })

    const existingTotal = parseFloat(existingRefunds._sum.amount?.toString() ?? '0')
    const originalAmount = parseFloat(expense.amount.toString())
    const remaining = originalAmount - existingTotal

    if (refundAmount > remaining + 0.001) { // small epsilon for float comparison
      throw new Error(
        `Refund amount exceeds the remaining refundable amount of RM${remaining.toFixed(2)}`
      )
    }

    return tx.transaction.create({
      data: {
        userId,
        accountId,
        categoryId: null,
        destinationAccountId: null,
        relatedTransactionId: expense.id,
        type: 'REFUND',
        amount: refundAmount,
        description: description.trim(),
        transactionDate: parseDateString(transactionDate),
        essential: false,
        notes: notes?.trim() || null,
      },
    })
  })
}

// ── Transaction queries ───────────────────────────────────────────────────────

// Shared include clause for all transaction queries
const transactionInclude = {
  account: { select: { id: true, name: true, institutionName: true } },
  category: { select: { id: true, name: true } },
  destinationAccount: { select: { id: true, name: true, institutionName: true } },
  relatedTransaction: {
    select: {
      id: true,
      description: true,
      amount: true,
      transactionDate: true,
      category: { select: { id: true, name: true } },
    },
  },
} as const

function serializeTransaction(t: {
  id: string
  type: string
  amount: { toString(): string }
  description: string
  transactionDate: Date
  essential: boolean
  notes: string | null
  merchant: string | null
  account: { id: string; name: string; institutionName: string | null }
  category: { id: string; name: string } | null
  destinationAccount: { id: string; name: string; institutionName: string | null } | null
  relatedTransaction: {
    id: string
    description: string
    amount: { toString(): string }
    transactionDate: Date
    category: { id: string; name: string } | null
  } | null
}, refundTotal?: string): TransactionWithRelations {
  return {
    id: t.id,
    type: t.type,
    amount: t.amount.toString(),
    description: t.description,
    transactionDate: t.transactionDate.toISOString().slice(0, 10),
    essential: t.essential,
    notes: t.notes,
    merchant: t.merchant,
    account: t.account,
    category: t.category,
    destinationAccount: t.destinationAccount,
    relatedTransaction: t.relatedTransaction
      ? {
          id: t.relatedTransaction.id,
          description: t.relatedTransaction.description,
          amount: t.relatedTransaction.amount.toString(),
          transactionDate: t.relatedTransaction.transactionDate.toISOString().slice(0, 10),
          category: t.relatedTransaction.category,
        }
      : null,
    refundTotal: refundTotal ?? '0.00',
  }
}

/**
 * Fetches transactions for the authenticated user with optional filters.
 * All filters combine with AND semantics.
 * Account filter matches accountId OR destinationAccountId.
 * Category filter matches EXPENSE.categoryId or REFUND's original expense categoryId.
 */
export async function getTransactions(filters: TransactionFilters): Promise<TransactionsResult> {
  const userId = await getAuthenticatedUserId()

  // Parse and validate month param — fall back to current month if invalid
  const now = new Date()
  const parsed = parseMonthParam(filters.month)
  const year = parsed?.year ?? now.getFullYear()
  const month = parsed?.month ?? (now.getMonth() + 1)
  const resolvedMonth = `${year}-${String(month).padStart(2, '0')}`

  const { start, end } = getMonthBounds(year, month)

  const search = filters.search?.trim() ?? ''
  const isFiltered = !!(search || filters.accountId || filters.categoryId || filters.type)

  // Build type filter
  const typeFilter = filters.type && filters.type !== '' ? { type: filters.type as never } : {}

  // Build account filter: OR between accountId and destinationAccountId
  let accountFilter = {}
  if (filters.accountId) {
    accountFilter = {
      OR: [
        { accountId: filters.accountId },
        { destinationAccountId: filters.accountId },
      ],
    }
  }

  // Build category filter:
  // For EXPENSE: match categoryId directly
  // For REFUND: match original expense's categoryId (via relatedTransaction.categoryId)
  // If a category filter is set and type filter is specifically INCOME/TRANSFER/CARD_PAYMENT,
  // the category filter would yield no results — that's correct behaviour.
  let categoryFilter = {}
  if (filters.categoryId) {
    categoryFilter = {
      OR: [
        { categoryId: filters.categoryId },
        {
          type: 'REFUND',
          relatedTransaction: { categoryId: filters.categoryId },
        },
      ],
    }
  }

  const rawTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: { gte: start, lt: end },
      ...typeFilter,
      ...(search
        ? { description: { contains: search, mode: 'insensitive' } }
        : {}),
      ...accountFilter,
      ...categoryFilter,
    },
    include: transactionInclude,
    orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
  })

  // Compute per-type totals
  let grossExpenses = 0
  let refundTotal = 0
  let incomeReceived = 0
  let transferTotal = 0
  let cardPaymentTotal = 0

  for (const t of rawTransactions) {
    const amt = parseFloat(t.amount.toString())
    if (t.type === 'EXPENSE') grossExpenses += amt
    else if (t.type === 'REFUND') refundTotal += amt
    else if (t.type === 'INCOME') incomeReceived += amt
    else if (t.type === 'TRANSFER') transferTotal += amt
    else if (t.type === 'CARD_PAYMENT') cardPaymentTotal += amt
  }

  const netRecordedSpending = grossExpenses - refundTotal

  const transactions: TransactionWithRelations[] = rawTransactions.map((t) =>
    serializeTransaction(t)
  )

  return {
    transactions,
    grossExpenses: grossExpenses.toFixed(2),
    refundTotal: refundTotal.toFixed(2),
    netRecordedSpending: netRecordedSpending.toFixed(2),
    incomeReceived: incomeReceived.toFixed(2),
    transferTotal: transferTotal.toFixed(2),
    cardPaymentTotal: cardPaymentTotal.toFixed(2),
    isFiltered,
    resolvedMonth,
  }
}

/**
 * Fetches a single transaction by ID for the authenticated user.
 * Includes refundTotal for EXPENSE transactions.
 * Never reveals whether another user's transaction exists.
 */
export async function getTransactionById(id: string): Promise<TransactionWithRelations | null> {
  const userId = await getAuthenticatedUserId()

  const raw = await prisma.transaction.findFirst({
    where: { id, userId },
    include: {
      ...transactionInclude,
      refundTransactions: {
        select: { id: true, amount: true, transactionDate: true, description: true },
      },
    },
  })

  if (!raw) return null

  // Calculate refund total for EXPENSE transactions
  let refundTotal = '0.00'
  if (raw.type === 'EXPENSE') {
    const total = raw.refundTransactions.reduce(
      (sum, r) => sum + parseFloat(r.amount.toString()),
      0
    )
    refundTotal = total.toFixed(2)
  }

  return serializeTransaction(raw, refundTotal)
}

// ── Expense update ────────────────────────────────────────────────────────────

/**
 * Updates an EXPENSE transaction.
 *
 * Security chain:
 *  1. Authenticated userId derived server-side
 *  2. Transaction ownership verified (id + userId)
 *  3. Transaction type must be EXPENSE
 *  4. New accountId verified against userId (active required, OR currently linked account)
 *  5. New categoryId verified against userId (active required, OR currently linked category)
 *  6. Refund guard: new amount must be >= cumulative refund total for this expense
 *  7. Revalidates /transactions and /transactions/[id]
 */
export async function updateExpense(transactionId: string, input: ExpenseFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = expenseSchema.safeParse(input)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid expense data')
  }

  const { amount, description, categoryId, accountId, transactionDate, essential, notes } =
    validated.data

  // Verify transaction ownership and type
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true, type: true, accountId: true, categoryId: true },
  })

  if (!existing) {
    throw new Error('Transaction not found or access denied')
  }

  if (existing.type !== 'EXPENSE') {
    throw new Error('Only EXPENSE transactions can be edited here')
  }

  // Refund guard: new amount must not be less than cumulative refunds
  const existingRefunds = await prisma.transaction.aggregate({
    where: { relatedTransactionId: transactionId, type: 'REFUND' },
    _sum: { amount: true },
  })
  const cumulativeRefundTotal = parseFloat(existingRefunds._sum.amount?.toString() ?? '0')
  const newAmount = parseFloat(amount)

  if (cumulativeRefundTotal > 0 && newAmount < cumulativeRefundTotal) {
    throw new Error(
      `Cannot reduce expense amount to RM${newAmount.toFixed(2)} because RM${cumulativeRefundTotal.toFixed(2)} has already been refunded against it.`
    )
  }

  // Verify account ownership — allow currently-linked account even if archived
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
      OR: [
        { active: true },
        { id: existing.accountId }, // Allow re-saving with the currently-linked archived account
      ],
    },
    select: { id: true },
  })
  if (!account) {
    throw new Error('Account not found or access denied')
  }

  // Verify category ownership — allow currently-linked category even if archived
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
      OR: [
        { active: true },
        { id: existing.categoryId ?? undefined }, // Allow re-saving with the currently-linked archived category
      ],
    },
    select: { id: true },
  })
  if (!category) {
    throw new Error('Category not found or access denied')
  }

  const trimmedDescription = description.trim()
  const trimmedNotes = notes && notes.trim() !== '' ? notes.trim() : null

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      accountId,
      categoryId,
      amount: newAmount,
      description: trimmedDescription,
      transactionDate: parseDateString(transactionDate),
      essential,
      notes: trimmedNotes,
    },
  })

  // Revalidate broadly — date may have changed months
  revalidatePath('/transactions')
  revalidatePath(`/transactions/${transactionId}`)
  revalidatePath('/dashboard')

  return updated
}

// ── Income update ─────────────────────────────────────────────────────────────

export async function updateIncomeTransaction(transactionId: string, input: IncomeFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = incomeSchema.safeParse(input)
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? 'Invalid income data')
  }

  const { amount, description, accountId, transactionDate, notes } = validated.data

  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true, type: true, accountId: true },
  })
  if (!existing) throw new Error('Transaction not found or access denied')
  if (existing.type !== 'INCOME') throw new Error('Only INCOME transactions can be edited here')

  const account = await prisma.account.findFirst({
    where: {
      id: accountId, userId,
      OR: [{ active: true }, { id: existing.accountId }],
    },
    select: { id: true, type: true },
  })
  if (!account) throw new Error('Account not found or access denied')
  if (account.type === 'CREDIT_CARD') throw new Error('Income cannot be recorded to a credit card account.')

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      accountId,
      amount: parseFloat(amount),
      description: description.trim(),
      transactionDate: parseDateString(transactionDate),
      notes: notes?.trim() || null,
    },
  })

  revalidatePath('/transactions')
  revalidatePath(`/transactions/${transactionId}`)
  revalidatePath('/dashboard')
  return updated
}

// ── Transfer update ───────────────────────────────────────────────────────────

export async function updateTransferTransaction(transactionId: string, input: TransferFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = transferSchema.safeParse(input)
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? 'Invalid transfer data')
  }

  const { amount, description, accountId, destinationAccountId, transactionDate, notes } = validated.data

  if (accountId === destinationAccountId) throw new Error('Source and destination accounts must be different')

  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true, type: true },
  })
  if (!existing) throw new Error('Transaction not found or access denied')
  if (existing.type !== 'TRANSFER') throw new Error('Only TRANSFER transactions can be edited here')

  const [source, dest] = await Promise.all([
    prisma.account.findFirst({ where: { id: accountId, userId, active: true }, select: { id: true, type: true } }),
    prisma.account.findFirst({ where: { id: destinationAccountId, userId, active: true }, select: { id: true, type: true } }),
  ])
  if (!source) throw new Error('Source account not found or access denied')
  if (!dest) throw new Error('Destination account not found or access denied')
  if (source.type === 'CREDIT_CARD') throw new Error('Credit card accounts cannot be the transfer source.')
  if (dest.type === 'CREDIT_CARD') throw new Error('Credit card accounts cannot be the transfer destination. Use Card Payment.')

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      accountId,
      destinationAccountId,
      amount: parseFloat(amount),
      description: description.trim(),
      transactionDate: parseDateString(transactionDate),
      notes: notes?.trim() || null,
    },
  })

  revalidatePath('/transactions')
  revalidatePath(`/transactions/${transactionId}`)
  revalidatePath('/dashboard')
  return updated
}

// ── Card Payment update ───────────────────────────────────────────────────────

export async function updateCardPaymentTransaction(transactionId: string, input: CardPaymentFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = cardPaymentSchema.safeParse(input)
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? 'Invalid card payment data')
  }

  const { amount, description, accountId, destinationAccountId, transactionDate, notes } = validated.data

  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true, type: true },
  })
  if (!existing) throw new Error('Transaction not found or access denied')
  if (existing.type !== 'CARD_PAYMENT') throw new Error('Only CARD_PAYMENT transactions can be edited here')

  const [source, dest] = await Promise.all([
    prisma.account.findFirst({ where: { id: accountId, userId, active: true }, select: { id: true, type: true } }),
    prisma.account.findFirst({ where: { id: destinationAccountId, userId, active: true }, select: { id: true, type: true } }),
  ])
  if (!source) throw new Error('Source account not found or access denied')
  if (source.type === 'CREDIT_CARD') throw new Error('The payment source cannot be a credit card account.')
  if (!dest) throw new Error('Credit card not found or access denied')
  if (dest.type !== 'CREDIT_CARD') throw new Error('The destination must be a credit card account.')

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      accountId,
      destinationAccountId,
      amount: parseFloat(amount),
      description: description.trim(),
      transactionDate: parseDateString(transactionDate),
      notes: notes?.trim() || null,
    },
  })

  revalidatePath('/transactions')
  revalidatePath(`/transactions/${transactionId}`)
  revalidatePath('/dashboard')
  revalidatePath('/credit-cards')
  return updated
}

// ── Refund update (concurrency-safe) ─────────────────────────────────────────

/**
 * Updates a REFUND transaction amount/account/date/description/notes.
 * relatedTransactionId (original expense) is immutable — delete and recreate to change it.
 *
 * Concurrency-safe: re-checks cumulative limit (excluding current refund) inside a locked transaction.
 */
export async function updateRefundTransaction(transactionId: string, input: RefundFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = refundSchema.safeParse(input)
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? 'Invalid refund data')
  }

  const { amount, description, accountId, relatedTransactionId, transactionDate, notes } = validated.data

  const refundAmount = parseFloat(amount)

  // Verify the current refund transaction
  const existingRefund = await prisma.transaction.findFirst({
    where: { id: transactionId, userId, type: 'REFUND' },
    select: { id: true, relatedTransactionId: true },
  })
  if (!existingRefund) throw new Error('Refund transaction not found or access denied')
  // relatedTransactionId is immutable on edit — must match the stored value
  if (existingRefund.relatedTransactionId !== relatedTransactionId) {
    throw new Error('The original expense cannot be changed. Delete this refund and create a new one.')
  }

  const receivingAccount = await prisma.account.findFirst({
    where: { id: accountId, userId, active: true },
    select: { id: true },
  })
  if (!receivingAccount) throw new Error('Receiving account not found or access denied')

  return prisma.$transaction(async (tx) => {
    // Lock the original expense row
    await tx.$executeRaw`
      SELECT id FROM transactions WHERE id = ${relatedTransactionId}::uuid FOR UPDATE
    `

    const expense = await tx.transaction.findFirst({
      where: { id: relatedTransactionId, userId, type: 'EXPENSE' },
      select: { id: true, amount: true },
    })
    if (!expense) throw new Error('Original expense not found')

    // Sum other refunds excluding this one
    const otherRefunds = await tx.transaction.aggregate({
      where: {
        relatedTransactionId: expense.id,
        type: 'REFUND',
        id: { not: transactionId },
      },
      _sum: { amount: true },
    })
    const otherTotal = parseFloat(otherRefunds._sum.amount?.toString() ?? '0')
    const originalAmount = parseFloat(expense.amount.toString())
    const remaining = originalAmount - otherTotal

    if (refundAmount > remaining + 0.001) {
      throw new Error(
        `Refund amount exceeds the remaining refundable amount of RM${remaining.toFixed(2)}`
      )
    }

    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        accountId,
        amount: refundAmount,
        description: description.trim(),
        transactionDate: parseDateString(transactionDate),
        notes: notes?.trim() || null,
      },
    })

    revalidatePath('/transactions')
    revalidatePath(`/transactions/${transactionId}`)
    revalidatePath(`/transactions/${relatedTransactionId}`)
    revalidatePath('/dashboard')
    return updated
  })
}

// ── Transaction deletion (generalised) ───────────────────────────────────────

/**
 * Hard-deletes any transaction type after verifying ownership.
 *
 * EXPENSE deletion guard:
 *  - Cannot delete an EXPENSE that has active REFUND transactions linked to it.
 *  - User must delete all refunds first, then delete the expense.
 *
 * REFUND / INCOME / TRANSFER / CARD_PAYMENT:
 *  - Hard delete without additional guards.
 */
export async function deleteTransaction(transactionId: string) {
  const userId = await getAuthenticatedUserId()

  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true, type: true },
  })

  if (!existing) {
    throw new Error('Transaction not found or access denied')
  }

  // EXPENSE guard: check for active refunds
  if (existing.type === 'EXPENSE') {
    const refundCount = await prisma.transaction.count({
      where: { relatedTransactionId: transactionId, type: 'REFUND' },
    })
    if (refundCount > 0) {
      throw new Error(
        `This expense has ${refundCount} refund${refundCount !== 1 ? 's' : ''} linked to it. Delete all refunds first, then delete the expense.`
      )
    }
  }

  await prisma.transaction.delete({
    where: { id: transactionId },
  })

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/credit-cards')
}

/** @deprecated Use deleteTransaction instead. */
export async function deleteExpense(transactionId: string) {
  return deleteTransaction(transactionId)
}

// ── Form data loading ─────────────────────────────────────────────────────────

/** Loads active accounts for the authenticated user (for the expense form). */
export async function getActiveAccountsForForm() {
  const userId = await getAuthenticatedUserId()
  return prisma.account.findMany({
    where: { userId, active: true },
    select: { id: true, name: true, institutionName: true, type: true },
    orderBy: { name: 'asc' },
  })
}

/** Loads active categories for the authenticated user (for the expense form). */
export async function getActiveCategoriesForForm() {
  const userId = await getAuthenticatedUserId()
  return prisma.category.findMany({
    where: { userId, active: true },
    select: { id: true, name: true, essentialDefault: true },
    orderBy: { name: 'asc' },
  })
}

/**
 * Loads active non-credit-card accounts.
 * Used for INCOME receiving account, TRANSFER source/destination, and CARD_PAYMENT source.
 */
export async function getActiveNonCreditCardAccountsForForm() {
  const userId = await getAuthenticatedUserId()
  return prisma.account.findMany({
    where: { userId, active: true, type: { not: 'CREDIT_CARD' } },
    select: { id: true, name: true, institutionName: true, type: true },
    orderBy: { name: 'asc' },
  })
}

/**
 * Loads active credit card accounts only.
 * Used for CARD_PAYMENT destination.
 */
export async function getCreditCardAccountsForForm() {
  const userId = await getAuthenticatedUserId()
  return prisma.account.findMany({
    where: { userId, active: true, type: 'CREDIT_CARD' },
    select: { id: true, name: true, institutionName: true, type: true },
    orderBy: { name: 'asc' },
  })
}

/**
 * Loads recent EXPENSE transactions for the refund original-expense picker.
 * Returns last 50 expenses ordered by date descending.
 */
export async function getExpensesForRefundForm() {
  const userId = await getAuthenticatedUserId()

  const expenses = await prisma.transaction.findMany({
    where: { userId, type: 'EXPENSE' },
    select: {
      id: true,
      description: true,
      amount: true,
      transactionDate: true,
      category: { select: { id: true, name: true } },
      refundTransactions: { select: { amount: true } },
    },
    orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })

  return expenses.map((e) => {
    const refunded = e.refundTransactions.reduce(
      (sum, r) => sum + parseFloat(r.amount.toString()),
      0
    )
    const originalAmount = parseFloat(e.amount.toString())
    const remaining = originalAmount - refunded
    return {
      id: e.id,
      description: e.description,
      amount: e.amount.toString(),
      transactionDate: e.transactionDate.toISOString().slice(0, 10),
      category: e.category,
      refundedAmount: refunded.toFixed(2),
      remainingRefundable: remaining.toFixed(2),
      fullyRefunded: remaining <= 0,
    }
  })
}

/**
 * Loads a single expense with its cumulative refund total.
 * Used for the "Record Refund from Expense Detail" flow.
 */
export async function getExpenseForRefundDetail(expenseId: string) {
  const userId = await getAuthenticatedUserId()

  const expense = await prisma.transaction.findFirst({
    where: { id: expenseId, userId, type: 'EXPENSE' },
    select: {
      id: true,
      description: true,
      amount: true,
      transactionDate: true,
      category: { select: { id: true, name: true } },
      refundTransactions: { select: { id: true, amount: true } },
    },
  })

  if (!expense) return null

  const refunded = expense.refundTransactions.reduce(
    (sum, r) => sum + parseFloat(r.amount.toString()),
    0
  )
  const originalAmount = parseFloat(expense.amount.toString())
  const remaining = originalAmount - refunded

  return {
    id: expense.id,
    description: expense.description,
    amount: expense.amount.toString(),
    transactionDate: expense.transactionDate.toISOString().slice(0, 10),
    category: expense.category,
    refundedAmount: refunded.toFixed(2),
    remainingRefundable: remaining.toFixed(2),
    fullyRefunded: remaining <= 0,
  }
}

/**
 * Loads accounts for the edit form.
 * Always includes the currently-linked account even if it has been archived,
 * so the form doesn't break when editing old transactions.
 */
export async function getAccountsForEditForm(currentAccountId: string) {
  const userId = await getAuthenticatedUserId()

  const [activeAccounts, currentAccount] = await Promise.all([
    prisma.account.findMany({
      where: { userId, active: true },
      select: { id: true, name: true, institutionName: true, active: true, type: true },
      orderBy: { name: 'asc' },
    }),
    prisma.account.findFirst({
      where: { id: currentAccountId, userId },
      select: { id: true, name: true, institutionName: true, active: true, type: true },
    }),
  ])

  // If the current account is inactive and not already in the active list, prepend it
  const currentAlreadyIncluded = activeAccounts.some((a) => a.id === currentAccountId)
  if (currentAccount && !currentAccount.active && !currentAlreadyIncluded) {
    return [currentAccount, ...activeAccounts]
  }

  return activeAccounts
}

/**
 * Loads categories for the edit form.
 * Always includes the currently-linked category even if it has been archived.
 */
export async function getCategoriesForEditForm(currentCategoryId: string) {
  const userId = await getAuthenticatedUserId()

  const [activeCategories, currentCategory] = await Promise.all([
    prisma.category.findMany({
      where: { userId, active: true },
      select: { id: true, name: true, essentialDefault: true, active: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findFirst({
      where: { id: currentCategoryId, userId },
      select: { id: true, name: true, essentialDefault: true, active: true },
    }),
  ])

  const currentAlreadyIncluded = activeCategories.some((c) => c.id === currentCategoryId)
  if (currentCategory && !currentCategory.active && !currentAlreadyIncluded) {
    return [currentCategory, ...activeCategories]
  }

  return activeCategories
}

/**
 * Loads accounts + categories for the filter bar on the transactions page.
 * Only active records — archived accounts/categories shouldn't appear as filter options.
 */
export async function getFilterOptions() {
  const userId = await getAuthenticatedUserId()

  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({
      where: { userId, active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { userId, active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return { accounts, categories }
}
