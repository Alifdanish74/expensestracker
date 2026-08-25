import 'server-only'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import { commitmentSchema, type CommitmentFormValues } from '../schemas/commitment-schema'

// ── Date Helpers ──────────────────────────────────────────────────────────────

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!))
}

function formatDateString(date: Date | null | undefined): string | null {
  if (!date) return null
  return date.toISOString().slice(0, 10)
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CommitmentWithRelations {
  id: string
  name: string
  defaultAmount: string
  dueDay: number
  variableAmount: boolean
  transferToWife: boolean
  startDate: string
  endDate: string | null
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

export interface CommitmentsResult {
  commitments: CommitmentWithRelations[]
  totalDefaultAmount: string
}

// ── Service Functions ─────────────────────────────────────────────────────────

/**
 * Retrieves all active commitments for the authenticated user.
 * Ordered by dueDay ASC, name ASC.
 * Computes total default planned monthly commitment amount.
 */
export async function getActiveCommitments(): Promise<CommitmentsResult> {
  const userId = await getAuthenticatedUserId()

  const rawCommitments = await prisma.commitment.findMany({
    where: {
      userId,
      active: true,
    },
    include: {
      category: { select: { id: true, name: true } },
      account: { select: { id: true, name: true, institutionName: true } },
    },
    orderBy: [{ dueDay: 'asc' }, { name: 'asc' }],
  })

  const commitments: CommitmentWithRelations[] = rawCommitments.map((c) => ({
    id: c.id,
    name: c.name,
    defaultAmount: c.defaultAmount.toString(),
    dueDay: c.dueDay,
    variableAmount: c.variableAmount,
    transferToWife: c.transferToWife,
    startDate: c.startDate.toISOString().slice(0, 10),
    endDate: formatDateString(c.endDate),
    active: c.active,
    notes: c.notes,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    category: c.category,
    account: c.account,
  }))

  const totalSum = rawCommitments.reduce(
    (acc, c) => acc + parseFloat(c.defaultAmount.toString()),
    0
  )

  return {
    commitments,
    totalDefaultAmount: totalSum.toFixed(2),
  }
}

/**
 * Retrieves a single active commitment by ID for the authenticated user.
 * Returns null if not found, archived, or owned by another user.
 */
export async function getCommitmentById(id: string): Promise<CommitmentWithRelations | null> {
  const userId = await getAuthenticatedUserId()

  const raw = await prisma.commitment.findFirst({
    where: {
      id,
      userId,
      active: true,
    },
    include: {
      category: { select: { id: true, name: true } },
      account: { select: { id: true, name: true, institutionName: true } },
    },
  })

  if (!raw) return null

  return {
    id: raw.id,
    name: raw.name,
    defaultAmount: raw.defaultAmount.toString(),
    dueDay: raw.dueDay,
    variableAmount: raw.variableAmount,
    transferToWife: raw.transferToWife,
    startDate: raw.startDate.toISOString().slice(0, 10),
    endDate: formatDateString(raw.endDate),
    active: raw.active,
    notes: raw.notes,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    category: raw.category,
    account: raw.account,
  }
}

/**
 * Creates a new commitment for the authenticated user.
 * Verifies category and optional account ownership before creation.
 * Does NOT create any Transaction records or alter Dashboard V1 actual expenses.
 */
export async function createCommitment(input: CommitmentFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = commitmentSchema.safeParse(input)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid commitment data')
  }

  const {
    name,
    defaultAmount,
    categoryId,
    accountId,
    dueDay,
    variableAmount,
    transferToWife,
    startDate,
    endDate,
    notes,
  } = validated.data

  const cleanAccountId = accountId && accountId.trim() !== '' ? accountId : null
  const dueDayNum = typeof dueDay === 'number' ? dueDay : parseInt(dueDay, 10)
  const cleanEndDate = endDate && endDate.trim() !== '' ? endDate : null
  const cleanNotes = notes && notes.trim() !== '' ? notes.trim() : null

  // Verify category ownership and active status
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId, active: true },
    select: { id: true },
  })
  if (!category) {
    throw new Error('Category not found or access denied')
  }

  // Verify optional account ownership and active status if supplied
  if (cleanAccountId) {
    const account = await prisma.account.findFirst({
      where: { id: cleanAccountId, userId, active: true },
      select: { id: true },
    })
    if (!account) {
      throw new Error('Account not found or access denied')
    }
  }

  return prisma.commitment.create({
    data: {
      userId,
      name: name.trim(),
      defaultAmount: parseFloat(defaultAmount),
      categoryId,
      accountId: cleanAccountId,
      dueDay: dueDayNum,
      variableAmount: !!variableAmount,
      transferToWife: !!transferToWife,
      startDate: parseDateString(startDate),
      endDate: cleanEndDate ? parseDateString(cleanEndDate) : null,
      notes: cleanNotes,
      active: true,
    },
  })
}

/**
 * Updates an existing commitment for the authenticated user.
 * Verifies ownership of commitment, category, and optional account before update.
 * Allows preserving currently-linked category or account even if archived.
 */
export async function updateCommitment(id: string, input: CommitmentFormValues) {
  const userId = await getAuthenticatedUserId()

  const validated = commitmentSchema.safeParse(input)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid commitment data')
  }

  // Verify existing commitment ownership and active status
  const existing = await prisma.commitment.findFirst({
    where: { id, userId, active: true },
    select: { id: true, categoryId: true, accountId: true },
  })
  if (!existing) {
    throw new Error('Commitment not found or access denied')
  }

  const {
    name,
    defaultAmount,
    categoryId,
    accountId,
    dueDay,
    variableAmount,
    transferToWife,
    startDate,
    endDate,
    notes,
  } = validated.data

  const cleanAccountId = accountId && accountId.trim() !== '' ? accountId : null
  const dueDayNum = typeof dueDay === 'number' ? dueDay : parseInt(dueDay, 10)
  const cleanEndDate = endDate && endDate.trim() !== '' ? endDate : null
  const cleanNotes = notes && notes.trim() !== '' ? notes.trim() : null

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

  // Verify optional account ownership if supplied (allow currently-linked account even if archived)
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

  return prisma.commitment.update({
    where: { id },
    data: {
      name: name.trim(),
      defaultAmount: parseFloat(defaultAmount),
      categoryId,
      accountId: cleanAccountId,
      dueDay: dueDayNum,
      variableAmount: !!variableAmount,
      transferToWife: !!transferToWife,
      startDate: parseDateString(startDate),
      endDate: cleanEndDate ? parseDateString(cleanEndDate) : null,
      notes: cleanNotes,
    },
  })
}

/**
 * Soft-deletes (archives) a commitment by setting active = false.
 * Verifies commitment ownership before archiving.
 */
export async function archiveCommitment(id: string) {
  const userId = await getAuthenticatedUserId()

  const existing = await prisma.commitment.findFirst({
    where: { id, userId, active: true },
    select: { id: true },
  })

  if (!existing) {
    throw new Error('Commitment not found or access denied')
  }

  return prisma.commitment.update({
    where: { id },
    data: { active: false },
  })
}

// ── Form Option Helper Functions ──────────────────────────────────────────────

/** Loads active categories for commitment forms. Includes current category if editing and archived. */
export async function getCategoriesForCommitmentForm(currentCategoryId?: string | null) {
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

/** Loads active accounts for commitment forms. Includes current account if editing and archived. */
export async function getAccountsForCommitmentForm(currentAccountId?: string | null) {
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
