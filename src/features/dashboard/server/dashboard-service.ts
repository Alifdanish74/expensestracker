import 'server-only'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import { parseMonthParam, getMonthBounds } from '@/features/transactions/server/transaction-service'
import { isPaymentOverdue, getTodayDateString } from '@/features/payments/utils/payment-status-utils'
import { getWifeTransferSummary } from '@/features/wife-transfers/server/wife-transfer-service'
import type {
  DashboardV2Summary,
  CategoryBreakdownItem,
  DashboardRecentTransaction,
  DashboardPaymentToHandle,
  DashboardInstallmentPreview,
} from '../types/dashboard-types'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolves a YYYY-MM string to { year, month }.
 * Falls back safely to the current month if the string is invalid.
 */
function resolveMonth(monthParam: string): { year: number; month: number; resolved: string } {
  const parsed = parseMonthParam(monthParam)
  const now = new Date()
  const year = parsed?.year ?? now.getFullYear()
  const month = parsed?.month ?? now.getMonth() + 1
  const resolved = `${year}-${String(month).padStart(2, '0')}`
  return { year, month, resolved }
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Fetches all data required for Dashboard V2.
 *
 * Security:
 *  - userId always derived from authenticated Supabase session
 *  - All queries are scoped strictly to userId — no cross-user data leakage
 *
 * Performance:
 *  - Fetches domain data in parallel using Promise.all
 *  - Read-only: zero mutations performed during render
 *
 * Returns a fully serialisable DashboardV2Summary DTO (no Prisma Decimal objects).
 */
export async function getDashboardSummary(monthParam: string): Promise<DashboardV2Summary> {
  const userId = await getAuthenticatedUserId()

  const { year, month, resolved } = resolveMonth(monthParam)
  const { start, end } = getMonthBounds(year, month)
  const todayStr = getTodayDateString()

  // Parallel database reads across financial domains
  const [
    profile,
    expenseAggregate,
    refundAggregate,
    categoryGroups,
    monthRefunds,
    recentRaw,
    monthlyPaymentsRaw,
    wifeTransferSummary,
    allActiveInstallments,
  ] = await Promise.all([
    // 1. Profile (monthlyNetIncome, salaryDay)
    prisma.profile.findUnique({
      where: { id: userId },
      select: { monthlyNetIncome: true, salaryDay: true },
    }),

    // 2. Total EXPENSE amount for the selected month
    prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),

    // 2b. Total REFUND amount for the selected month
    prisma.transaction.aggregate({
      where: {
        userId,
        type: 'REFUND',
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),

    // 3. EXPENSE amounts grouped by category for the selected month
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),

    // 3b. REFUND transactions for the selected month to attribute refunds to categories
    prisma.transaction.findMany({
      where: {
        userId,
        type: 'REFUND',
        transactionDate: { gte: start, lt: end },
        relatedTransactionId: { not: null },
      },
      select: {
        amount: true,
        relatedTransaction: {
          select: { categoryId: true },
        },
      },
    }),

    // 4. 5 most recent EXPENSE or REFUND transactions for the selected month
    prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ['EXPENSE', 'REFUND'] },
        transactionDate: { gte: start, lt: end },
      },
      include: {
        category: { select: { id: true, name: true } },
        account: { select: { id: true, name: true, institutionName: true } },
      },
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    }),

    // 5. MonthlyPayment obligations for the selected month
    prisma.monthlyPayment.findMany({
      where: {
        userId,
        paymentYear: year,
        paymentMonth: month,
      },
      orderBy: [{ dueDate: 'asc' }, { sourceName: 'asc' }],
    }),

    // 6. WifeTransfer monthly summary
    getWifeTransferSummary(year, month),

    // 7. Active Instalment plans
    prisma.installment.findMany({
      where: {
        userId,
        active: true,
      },
      orderBy: [{ remainingPayments: 'asc' }, { dueDay: 'asc' }, { name: 'asc' }],
    }),
  ])

  // ── 1. Income Domain ───────────────────────────────────────────────────────

  const rawIncome = profile?.monthlyNetIncome ?? null
  const incomeConfigured = rawIncome !== null
  const monthlyNetIncomeStr = incomeConfigured ? rawIncome.toString() : null
  const incomeNum = incomeConfigured && rawIncome !== null ? parseFloat(rawIncome.toString()) : null

  // ── 2. Actual Spending Domain ───────────────────────────────────────────────

  const grossExpensesNum = parseFloat(expenseAggregate._sum.amount?.toString() ?? '0')
  const refundsNum = parseFloat(refundAggregate._sum.amount?.toString() ?? '0')
  const netRecordedSpendingNum = grossExpensesNum - refundsNum

  const grossExpenses = grossExpensesNum.toFixed(2)
  const refunds = refundsNum.toFixed(2)
  const netRecordedSpending = netRecordedSpendingNum.toFixed(2)

  let remainingAfterRecordedExpenses: string | null = null
  if (incomeConfigured && incomeNum !== null) {
    const rem = incomeNum - netRecordedSpendingNum
    remainingAfterRecordedExpenses = rem.toFixed(2)
  }

  // Calculate per-category refund subtractions
  const refundMap = new Map<string, number>()
  for (const ref of monthRefunds) {
    const catId = ref.relatedTransaction?.categoryId
    if (catId) {
      const amt = parseFloat(ref.amount.toString())
      refundMap.set(catId, (refundMap.get(catId) ?? 0) + amt)
    }
  }

  // Combine category expenses and refunds
  const categoryNetMap = new Map<string, number>()
  for (const g of categoryGroups) {
    if (g.categoryId) {
      const gross = parseFloat(g._sum.amount?.toString() ?? '0')
      const ref = refundMap.get(g.categoryId) ?? 0
      categoryNetMap.set(g.categoryId, gross - ref)
    }
  }

  const categoryIds = Array.from(categoryNetMap.keys())
  const categoryNames =
    categoryIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds }, userId },
          select: { id: true, name: true },
        })
      : []
  const categoryNameMap = new Map(categoryNames.map((c) => [c.id, c.name]))

  // Sort categories by net spending descending
  const sortedCategoryEntries = Array.from(categoryNetMap.entries()).sort((a, b) => b[1] - a[1])
  const top5Categories = sortedCategoryEntries.slice(0, 5)

  const categorySpending: CategoryBreakdownItem[] = top5Categories.map(([catId, netAmt]) => {
    const pct = netRecordedSpendingNum > 0 ? Math.max(0, (netAmt / netRecordedSpendingNum) * 100) : 0
    return {
      categoryId: catId,
      categoryName: categoryNameMap.get(catId) ?? 'Unknown',
      amount: netAmt.toFixed(2),
      percentage: Math.round(pct * 10) / 10,
    }
  })

  // Recent actual expense & refund transactions
  const recentTransactions: DashboardRecentTransaction[] = recentRaw.map((t) => ({
    id: t.id,
    description: t.description,
    amount: t.amount.toString(),
    transactionDate: t.transactionDate.toISOString().slice(0, 10),
    type: t.type,
    essential: t.essential,
    category: t.category,
    account: t.account,
  }))

  // ── 3. Monthly Obligations Domain ──────────────────────────────────────────

  let plannedTotalNum = 0
  let paidTotalNum = 0
  let remainingTotalNum = 0
  let needsAttentionCount = 0

  for (const p of monthlyPaymentsRaw) {
    const planned = parseFloat(p.plannedAmount.toString())
    const actual = p.actualAmount ? parseFloat(p.actualAmount.toString()) : 0
    const dueDateStr = p.dueDate.toISOString().slice(0, 10)
    const isOverdue = isPaymentOverdue(dueDateStr, p.status, todayStr)

    plannedTotalNum += planned
    paidTotalNum += actual

    if (p.status === 'PAID') {
      // remaining contribution = 0
    } else if (p.status === 'SKIPPED') {
      // remaining contribution = 0
    } else if (p.status === 'AMOUNT_REQUIRED') {
      remainingTotalNum += planned
    } else {
      // PENDING or PARTIALLY_PAID
      remainingTotalNum += Math.max(planned - actual, 0)
    }

    const needsAttention =
      p.status === 'AMOUNT_REQUIRED' || p.status === 'PARTIALLY_PAID' || isOverdue
    if (needsAttention) {
      needsAttentionCount++
    }
  }

  // ── 4. Payments to Handle Section ──────────────────────────────────────────

  const candidatePayments = monthlyPaymentsRaw.filter(
    (p) => p.status !== 'PAID' && p.status !== 'SKIPPED'
  )

  candidatePayments.sort((a, b) => {
    const aDueDateStr = a.dueDate.toISOString().slice(0, 10)
    const bDueDateStr = b.dueDate.toISOString().slice(0, 10)
    const aOverdue = isPaymentOverdue(aDueDateStr, a.status, todayStr)
    const bOverdue = isPaymentOverdue(bDueDateStr, b.status, todayStr)

    const getRank = (p: typeof a, overdue: boolean) => {
      if (overdue) return 1
      if (p.status === 'AMOUNT_REQUIRED') return 2
      if (p.status === 'PARTIALLY_PAID') return 3
      return 4
    }

    const rankA = getRank(a, aOverdue)
    const rankB = getRank(b, bOverdue)

    if (rankA !== rankB) return rankA - rankB
    if (aDueDateStr !== bDueDateStr) return aDueDateStr.localeCompare(bDueDateStr)
    return a.sourceName.localeCompare(b.sourceName)
  })

  const topPaymentsToHandle = candidatePayments.slice(0, 5)
  const paymentsToHandle: DashboardPaymentToHandle[] = topPaymentsToHandle.map((p) => {
    const dueDateStr = p.dueDate.toISOString().slice(0, 10)
    return {
      id: p.id,
      sourceName: p.sourceName,
      plannedAmount: p.plannedAmount.toString(),
      actualAmount: p.actualAmount ? p.actualAmount.toString() : null,
      dueDate: dueDateStr,
      status: p.status,
      variableAmount: p.variableAmount,
      transferToWife: p.transferToWife,
      sourceType: p.installmentId ? 'INSTALLMENT' : 'COMMITMENT',
      isOverdue: isPaymentOverdue(dueDateStr, p.status, todayStr),
    }
  })

  // ── 5. Transfer to Wife Domain ─────────────────────────────────────────────

  const wifeTransferHasItems =
    wifeTransferSummary.paymentCount > 0 || wifeTransferSummary.transfers.length > 0

  // ── 6. Instalment Progress Domain ─────────────────────────────────────────

  let activeCount = 0
  let nearCompletionCount = 0
  let completedCount = 0

  for (const inst of allActiveInstallments) {
    if (inst.remainingPayments > 0) {
      activeCount++
      if (inst.remainingPayments <= 3) {
        nearCompletionCount++
      }
    } else {
      completedCount++
    }
  }

  const activeInstallments = allActiveInstallments.filter((i) => i.remainingPayments > 0)
  const previewInstallments: DashboardInstallmentPreview[] = activeInstallments.slice(0, 3).map((i) => ({
    id: i.id,
    name: i.name,
    monthlyAmount: i.monthlyAmount.toString(),
    totalPayments: i.totalPayments,
    remainingPayments: i.remainingPayments,
    dueDay: i.dueDay,
  }))

  // ── Construct DTO ──────────────────────────────────────────────────────────

  return {
    month: {
      year,
      month,
      key: resolved,
    },
    income: {
      configured: incomeConfigured,
      monthlyNetIncome: monthlyNetIncomeStr,
    },
    actual: {
      grossExpenses,
      refunds,
      netRecordedSpending,
      paidObligations: paidTotalNum.toFixed(2),
      totalPaidOutflow: (netRecordedSpendingNum + paidTotalNum).toFixed(2),
      remainingAfterRecordedExpenses,
      netRemainingAfterPaidOutflows:
        incomeConfigured && incomeNum !== null
          ? (incomeNum - (netRecordedSpendingNum + paidTotalNum)).toFixed(2)
          : null,
      categorySpending,
      recentTransactions,
    },
    obligations: {
      planned: plannedTotalNum.toFixed(2),
      paid: paidTotalNum.toFixed(2),
      remaining: remainingTotalNum.toFixed(2),
      needsAttentionCount,
      isPrepared: monthlyPaymentsRaw.length > 0,
    },
    paymentsToHandle,
    wifeTransfer: {
      hasItems: wifeTransferHasItems,
      readyRequired: wifeTransferSummary.readyRequiredTotal,
      unconfirmedExpected: wifeTransferSummary.unconfirmedExpectedTotal,
      transferred: wifeTransferSummary.transferredTotal,
      remaining: wifeTransferSummary.remainingTotal,
      excess: wifeTransferSummary.excessTotal,
      unconfirmedCount: wifeTransferSummary.unconfirmedCount,
      isPrepared: wifeTransferSummary.isPrepared,
    },
    installments: {
      activeCount,
      nearCompletionCount,
      completedCount,
      preview: previewInstallments,
    },
  }
}
