import 'server-only'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import { installmentSchema, type InstallmentFormValues } from '../schemas/installment-schema'

// ── Date Helpers ──────────────────────────────────────────────────────────────

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!))
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InstallmentWithRelations {
  id: string
  name: string
  monthlyAmount: string
  totalPayments: number | null
  remainingPayments: number
  dueDay: number
  startDate: string
  active: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
  category: {
    id: string
    name: string
  }
  account: {
    id: string
    name: string
    institutionName: string | null
  } | null
}

// ── Service Functions ─────────────────────────────────────────────────────────

/**
 * Retrieves all active instalments for the authenticated user.
 * Ordered by dueDay ASC, name ASC.
 */
export async function getActiveInstallments(): Promise<InstallmentWithRelations[]> {
  const userId = await getAuthenticatedUserId()

  const raw = await prisma.installment.findMany({
    where: { userId, active: true },
    include: {
      category: { select: { id: true, name: true } },
      account: { select: { id: true, name: true, institutionName: true } },
    },
    orderBy: [{ dueDay: 'asc' }, { name: 'asc' }],
  })

  return raw.map((i) => ({
    id: i.id,
    name: i.name,
    monthlyAmount: i.monthlyAmount.toString(),
    totalPayments: i.totalPayments,
    remainingPayments: i.remainingPayments,
    dueDay: i.dueDay,
    startDate: i.startDate.toISOString().slice(0, 10),
    active: i.active,
    notes: i.notes,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    category: i.category,
    account: i.account,
  }))
}

/**
 * Retrieves a single active instalment by ID for the authenticated user.
 * Returns null if not found, archived, or owned by another user.
 * Never leaks existence of foreign-user records.
 */
export async function getInstallmentById(id: string): Promise<InstallmentWithRelations | null> {
  const userId = await getAuthenticatedUserId()

  const raw = await prisma.installment.findFirst({
    where: { id, userId, active: true },
    include: {
      category: { select: { id: true, name: true } },
      account: { select: { id: true, name: true, institutionName: true } },
    },
  })

  if (!raw) return null

  return {
    id: raw.id,
    name: raw.name,
    monthlyAmount: raw.monthlyAmount.toString(),
    totalPayments: raw.totalPayments,
    remainingPayments: raw.remainingPayments,
    dueDay: raw.dueDay,
    startDate: raw.startDate.toISOString().slice(0, 10),
    active: raw.active,
    notes: raw.notes,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    category: raw.category,
    account: raw.account,
  }
}

/**
 * Checks count of generated MonthlyPayment history records for an instalment.
 */
export async function getInstallmentPaymentHistoryCount(id: string): Promise<number> {
  const userId = await getAuthenticatedUserId()

  return prisma.monthlyPayment.count({
    where: {
      installmentId: id,
      userId,
    },
  })
}

/**
 * Creates a new instalment for the authenticated user.
 * Verifies category and optional account ownership before creation.
 */
export async function createInstallment(input: InstallmentFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = installmentSchema.safeParse(input)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid instalment data')
  }

  const { name, monthlyAmount, categoryId, accountId, remainingPayments, totalPayments, dueDay, startDate, notes } =
    validated.data

  const cleanAccountId = accountId && accountId.trim() !== '' ? accountId : null
  const cleanNotes = notes && notes.trim() !== '' ? notes.trim() : null
  const dueDayNum = typeof dueDay === 'number' ? dueDay : parseInt(String(dueDay), 10)

  const remainingNum =
    typeof remainingPayments === 'number' ? remainingPayments : parseInt(String(remainingPayments), 10)

  let totalNum: number | null = null
  if (totalPayments !== undefined && totalPayments !== '' && totalPayments !== null) {
    totalNum = typeof totalPayments === 'number' ? totalPayments : parseInt(String(totalPayments), 10)
  }

  // Verify category ownership and active status
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId, active: true },
    select: { id: true },
  })
  if (!category) {
    throw new Error('Category not found or access denied')
  }

  // Verify optional account ownership and active status
  if (cleanAccountId) {
    const account = await prisma.account.findFirst({
      where: { id: cleanAccountId, userId, active: true },
      select: { id: true },
    })
    if (!account) {
      throw new Error('Account not found or access denied')
    }
  }

  return prisma.installment.create({
    data: {
      userId,
      name: name.trim(),
      monthlyAmount: parseFloat(monthlyAmount),
      categoryId,
      accountId: cleanAccountId,
      remainingPayments: remainingNum,
      totalPayments: totalNum,
      dueDay: dueDayNum,
      startDate: parseDateString(startDate),
      notes: cleanNotes,
      active: true,
    },
  })
}

/**
 * Updates an existing instalment for the authenticated user.
 * Verifies ownership of instalment, category, and optional account before update.
 * Locks manual remainingPayments modification if MonthlyPayment history exists.
 */
export async function updateInstallment(id: string, input: InstallmentFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = installmentSchema.safeParse(input)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid instalment data')
  }

  // Verify ownership and active status
  const existing = await prisma.installment.findFirst({
    where: { id, userId, active: true },
    select: { id: true, categoryId: true, accountId: true, remainingPayments: true },
  })
  if (!existing) {
    throw new Error('Instalment not found or access denied')
  }

  const { name, monthlyAmount, categoryId, accountId, remainingPayments, totalPayments, dueDay, startDate, notes } =
    validated.data

  const cleanAccountId = accountId && accountId.trim() !== '' ? accountId : null
  const cleanNotes = notes && notes.trim() !== '' ? notes.trim() : null
  const dueDayNum = typeof dueDay === 'number' ? dueDay : parseInt(String(dueDay), 10)

  const remainingNum =
    typeof remainingPayments === 'number' ? remainingPayments : parseInt(String(remainingPayments), 10)

  // Enforce server-side lock: if payment history exists, remainingPayments cannot be modified manually
  const historyCount = await prisma.monthlyPayment.count({
    where: { installmentId: id, userId },
  })

  if (historyCount > 0 && remainingNum !== existing.remainingPayments) {
    throw new Error('Payments remaining can no longer be edited manually because payment history exists.')
  }

  let totalNum: number | null = null
  if (totalPayments !== undefined && totalPayments !== '' && totalPayments !== null) {
    totalNum = typeof totalPayments === 'number' ? totalPayments : parseInt(String(totalPayments), 10)
  }

  // Verify category ownership (allow currently-linked category even if archived)
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
      OR: [{ active: true }, { id: existing.categoryId }],
    },
    select: { id: true },
  })
  if (!category) {
    throw new Error('Category not found or access denied')
  }

  // Verify optional account ownership (allow currently-linked account even if archived)
  if (cleanAccountId) {
    const account = await prisma.account.findFirst({
      where: {
        id: cleanAccountId,
        userId,
        OR: [
          { active: true },
          ...(existing.accountId ? [{ id: existing.accountId }] : []),
        ],
      },
      select: { id: true },
    })
    if (!account) {
      throw new Error('Account not found or access denied')
    }
  }

  return prisma.installment.update({
    where: { id },
    data: {
      name: name.trim(),
      monthlyAmount: parseFloat(monthlyAmount),
      categoryId,
      accountId: cleanAccountId,
      remainingPayments: remainingNum,
      totalPayments: totalNum,
      dueDay: dueDayNum,
      startDate: parseDateString(startDate),
      notes: cleanNotes,
    },
  })
}

/**
 * Soft-archives an instalment by setting active = false.
 * Verifies ownership before archiving.
 *
 * IMPORTANT: Archive means "manually stopped / removed from active list".
 * It does NOT mean "all payments were completed".
 * Archive does NOT set remainingPayments to zero.
 */
export async function archiveInstallment(id: string) {
  const userId = await getAuthenticatedUserId()

  const existing = await prisma.installment.findFirst({
    where: { id, userId, active: true },
    select: { id: true },
  })

  if (!existing) {
    throw new Error('Instalment not found or access denied')
  }

  return prisma.installment.update({
    where: { id },
    data: { active: false },
  })
}

// ── Form Option Helper Functions ──────────────────────────────────────────────

/** Loads active categories for instalment forms. Includes currently-linked category if archived. */
export async function getCategoriesForInstallmentForm(currentCategoryId?: string | null) {
  const userId = await getAuthenticatedUserId()

  const activeCategories = await prisma.category.findMany({
    where: { userId, active: true },
    select: { id: true, name: true, active: true },
    orderBy: { name: 'asc' },
  })

  if (currentCategoryId) {
    const isIncluded = activeCategories.some((c) => c.id === currentCategoryId)
    if (!isIncluded) {
      const currentCategory = await prisma.category.findFirst({
        where: { id: currentCategoryId, userId },
        select: { id: true, name: true, active: true },
      })
      if (currentCategory) {
        return [currentCategory, ...activeCategories]
      }
    }
  }

  return activeCategories
}

/** Loads active accounts for instalment forms. Includes currently-linked account if archived. */
export async function getAccountsForInstallmentForm(currentAccountId?: string | null) {
  const userId = await getAuthenticatedUserId()

  const activeAccounts = await prisma.account.findMany({
    where: { userId, active: true },
    select: { id: true, name: true, institutionName: true, active: true },
    orderBy: { name: 'asc' },
  })

  if (currentAccountId) {
    const isIncluded = activeAccounts.some((a) => a.id === currentAccountId)
    if (!isIncluded) {
      const currentAccount = await prisma.account.findFirst({
        where: { id: currentAccountId, userId },
        select: { id: true, name: true, institutionName: true, active: true },
      })
      if (currentAccount) {
        return [currentAccount, ...activeAccounts]
      }
    }
  }

  return activeAccounts
}
