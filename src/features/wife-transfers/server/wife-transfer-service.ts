import 'server-only'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import type {
  WifeTransferSummary,
  WifeTransferPaymentItem,
  WifeTransferRecord,
} from '../types/wife-transfer-types'
import type { RecordWifeTransferInput } from '../schemas/wife-transfer-schemas'

/**
 * Calculates and returns the complete monthly Wife Transfer summary for the given year and month.
 *
 * Rules:
 * - Requirements are calculated strictly from MonthlyPayment snapshots where transferToWife = true.
 * - PENDING, PARTIALLY_PAID, PAID -> included in readyRequiredTotal (using plannedAmount).
 * - AMOUNT_REQUIRED -> included in unconfirmedExpectedTotal and unconfirmedCount.
 * - SKIPPED -> excluded from requirements.
 * - Transferred total is the sum of WifeTransfer.amount for that assigned obligation month.
 * - remainingTotal = max(readyRequiredTotal - transferredTotal, 0).
 * - excessTotal = max(transferredTotal - readyRequiredTotal, 0).
 */
export async function getWifeTransferSummary(
  year: number,
  month: number
): Promise<WifeTransferSummary> {
  const userId = await getAuthenticatedUserId()

  if (isNaN(year) || year < 2000 || year > 2100) {
    throw new Error('Invalid year parameter')
  }
  if (isNaN(month) || month < 1 || month > 12) {
    throw new Error('Invalid month parameter')
  }

  const resolvedMonth = `${year}-${String(month).padStart(2, '0')}`

  // 1. Query all MonthlyPayment snapshots for this month where transferToWife = true
  const rawPayments = await prisma.monthlyPayment.findMany({
    where: {
      userId,
      paymentYear: year,
      paymentMonth: month,
      transferToWife: true,
    },
    include: {
      category: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { sourceName: 'asc' }],
  })

  // Check if payments have been prepared for this month generally
  const anyPaymentCount = await prisma.monthlyPayment.count({
    where: {
      userId,
      paymentYear: year,
      paymentMonth: month,
    },
  })
  const isPrepared = anyPaymentCount > 0

  const includedItems: WifeTransferPaymentItem[] = []
  const unconfirmedItems: WifeTransferPaymentItem[] = []
  const skippedItems: WifeTransferPaymentItem[] = []

  let readyRequiredTotalNum = 0
  let unconfirmedExpectedTotalNum = 0

  for (const p of rawPayments) {
    const planned = parseFloat(p.plannedAmount.toString())
    const item: WifeTransferPaymentItem = {
      id: p.id,
      commitmentName: p.sourceName,
      plannedAmount: p.plannedAmount.toString(),
      actualAmount: p.actualAmount ? p.actualAmount.toString() : null,
      status: p.status,
      dueDate: p.dueDate.toISOString().slice(0, 10),
      variableAmount: p.variableAmount,
      transferToWife: p.transferToWife,
      category: p.category,
      account: p.account,
    }

    if (p.status === 'AMOUNT_REQUIRED') {
      unconfirmedItems.push(item)
      unconfirmedExpectedTotalNum += planned
    } else if (p.status === 'SKIPPED') {
      skippedItems.push(item)
    } else {
      // PENDING, PARTIALLY_PAID, PAID
      includedItems.push(item)
      readyRequiredTotalNum += planned
    }
  }

  // 2. Query recorded WifeTransfer records for assigned obligation month
  const rawTransfers = await prisma.wifeTransfer.findMany({
    where: {
      userId,
      paymentYear: year,
      paymentMonth: month,
    },
    include: {
      sourceAccount: { select: { id: true, name: true } },
    },
    orderBy: [{ transferDate: 'desc' }, { createdAt: 'desc' }],
  })

  let transferredTotalNum = 0
  const transfers: WifeTransferRecord[] = rawTransfers.map((t) => {
    const amt = parseFloat(t.amount.toString())
    transferredTotalNum += amt

    return {
      id: t.id,
      userId: t.userId,
      paymentYear: t.paymentYear,
      paymentMonth: t.paymentMonth,
      amount: t.amount.toString(),
      transferDate: t.transferDate.toISOString().slice(0, 10),
      sourceAccountId: t.sourceAccountId,
      sourceAccountName: t.sourceAccount ? t.sourceAccount.name : null,
      notes: t.notes,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  })

  const remainingTotalNum = Math.max(readyRequiredTotalNum - transferredTotalNum, 0)
  const excessTotalNum = Math.max(transferredTotalNum - readyRequiredTotalNum, 0)

  return {
    resolvedMonth,
    year,
    month,
    readyRequiredTotal: readyRequiredTotalNum.toFixed(2),
    unconfirmedExpectedTotal: unconfirmedExpectedTotalNum.toFixed(2),
    transferredTotal: transferredTotalNum.toFixed(2),
    remainingTotal: remainingTotalNum.toFixed(2),
    excessTotal: excessTotalNum.toFixed(2),
    unconfirmedCount: unconfirmedItems.length,
    paymentCount: rawPayments.length,
    includedItems,
    unconfirmedItems,
    skippedItems,
    transfers,
    isPrepared,
  }
}

/**
 * Records a new funding transfer to wife.
 * Does NOT alter MonthlyPayment, Transaction, Commitment, or Account.currentBalance.
 */
export async function recordWifeTransferRecord(
  input: RecordWifeTransferInput
): Promise<void> {
  const userId = await getAuthenticatedUserId()

  // If sourceAccountId is supplied, verify ownership and active status
  if (input.sourceAccountId) {
    const acc = await prisma.account.findFirst({
      where: {
        id: input.sourceAccountId,
        userId,
      },
    })
    if (!acc) {
      throw new Error('The selected source account is unavailable or invalid.')
    }
  }

  await prisma.wifeTransfer.create({
    data: {
      userId,
      paymentYear: input.paymentYear,
      paymentMonth: input.paymentMonth,
      amount: input.amount,
      transferDate: new Date(input.transferDate),
      sourceAccountId: input.sourceAccountId,
      notes: input.notes,
    },
  })
}

/**
 * Deletes an incorrectly recorded WifeTransfer entry.
 * Scoped strictly to authenticated userId + record ID.
 */
export async function deleteWifeTransferRecord(id: string): Promise<void> {
  const userId = await getAuthenticatedUserId()

  const result = await prisma.wifeTransfer.deleteMany({
    where: {
      id,
      userId,
    },
  })

  if (result.count === 0) {
    throw new Error('The transfer record could not be found or could not be deleted.')
  }
}
