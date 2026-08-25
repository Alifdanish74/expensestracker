import 'server-only'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@/generated/prisma/enums'
import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import { calculateDueDate } from '../utils/calculate-due-date'
import type {
  MonthlyPaymentWithRelations,
  MonthlyPaymentsResult,
  MonthlyPaymentSummary,
  GenerationResult,
} from '../types/monthly-payment-types'

/**
 * Idempotently generates MonthlyPayment snapshots for all applicable active commitments
 * and eligible active instalments for a given year and month.
 */
export async function syncCommitmentsToMonthlyPayments(
  year: number,
  month: number
): Promise<GenerationResult> {
  const userId = await getAuthenticatedUserId()

  if (isNaN(year) || year < 2000 || year > 2100) {
    throw new Error('Invalid year parameter')
  }
  if (isNaN(month) || month < 1 || month > 12) {
    throw new Error('Invalid month parameter')
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const monthEnd = new Date(Date.UTC(year, month, 0))

  // 1. Fetch applicable commitments
  const applicableCommitments = await prisma.commitment.findMany({
    where: {
      userId,
      active: true,
      startDate: { lte: monthEnd },
      OR: [{ endDate: null }, { endDate: { gte: monthStart } }],
    },
  })

  const existingCommitmentPayments = await prisma.monthlyPayment.findMany({
    where: {
      userId,
      paymentYear: year,
      paymentMonth: month,
      commitmentId: { not: null },
    },
    select: { commitmentId: true },
  })

  const existingCommitmentIds = new Set(existingCommitmentPayments.map((p) => p.commitmentId))
  const missingCommitments = applicableCommitments.filter((c) => !existingCommitmentIds.has(c.id))

  const commitmentDataToInsert = missingCommitments.map((commitment) => {
    const dueDate = calculateDueDate(year, month, commitment.dueDay)
    const status: PaymentStatus = commitment.variableAmount
      ? PaymentStatus.AMOUNT_REQUIRED
      : PaymentStatus.PENDING

    return {
      userId,
      commitmentId: commitment.id,
      installmentId: null,
      paymentYear: year,
      paymentMonth: month,
      sourceName: commitment.name,
      plannedAmount: commitment.defaultAmount,
      actualAmount: null,
      dueDate,
      paidDate: null,
      status,
      variableAmount: commitment.variableAmount,
      transferToWife: commitment.transferToWife,
      categoryId: commitment.categoryId,
      accountId: commitment.accountId,
    }
  })

  // 2. Fetch and calculate eligible instalments with unresolved-slot protection inside transaction
  const { installmentDataToInsert, applicableInstallmentsCount, skippedNoSlotsCount } =
    await prisma.$transaction(async (tx) => {
      const applicableInstallments = await tx.installment.findMany({
        where: {
          userId,
          active: true,
          remainingPayments: { gt: 0 },
          startDate: { lte: monthEnd },
        },
      })

      const toInsert: Array<{
        userId: string
        commitmentId: null
        installmentId: string
        paymentYear: number
        paymentMonth: number
        sourceName: string
        plannedAmount: typeof applicableInstallments[0]['monthlyAmount']
        actualAmount: null
        dueDate: Date
        paidDate: null
        status: PaymentStatus
        variableAmount: boolean
        transferToWife: boolean
        categoryId: string
        accountId: string | null
      }> = []

      let noSlotsCount = 0

      for (const inst of applicableInstallments) {
        // Check if payment already exists for this year and month
        const existingForMonth = await tx.monthlyPayment.findFirst({
          where: {
            userId,
            installmentId: inst.id,
            paymentYear: year,
            paymentMonth: month,
          },
          select: { id: true },
        })

        if (existingForMonth) {
          continue
        }

        // Count unresolved slots across all months for this installment
        const unresolvedCount = await tx.monthlyPayment.count({
          where: {
            userId,
            installmentId: inst.id,
            status: {
              in: [
                PaymentStatus.PENDING,
                PaymentStatus.AMOUNT_REQUIRED,
                PaymentStatus.PARTIALLY_PAID,
              ],
            },
          },
        })

        const availableSlots = Math.max(0, inst.remainingPayments - unresolvedCount)

        if (availableSlots > 0) {
          const dueDate = calculateDueDate(year, month, inst.dueDay)
          toInsert.push({
            userId,
            commitmentId: null,
            installmentId: inst.id,
            paymentYear: year,
            paymentMonth: month,
            sourceName: inst.name,
            plannedAmount: inst.monthlyAmount,
            actualAmount: null,
            dueDate,
            paidDate: null,
            status: PaymentStatus.PENDING,
            variableAmount: false,
            transferToWife: false,
            categoryId: inst.categoryId,
            accountId: inst.accountId,
          })
        } else {
          noSlotsCount++
        }
      }

      return {
        installmentDataToInsert: toInsert,
        applicableInstallmentsCount: applicableInstallments.length,
        skippedNoSlotsCount: noSlotsCount,
      }
    })

  const allDataToInsert = [...commitmentDataToInsert, ...installmentDataToInsert]

  let createdCount = 0
  if (allDataToInsert.length > 0) {
    const result = await prisma.monthlyPayment.createMany({
      data: allDataToInsert,
      skipDuplicates: true,
    })
    createdCount = result.count
  }

  const totalApplicable = applicableCommitments.length + applicableInstallmentsCount
  const skippedCount = totalApplicable - createdCount

  return {
    createdCount,
    skippedCount,
    totalApplicableCommitments: applicableCommitments.length,
    totalApplicableInstallments: applicableInstallmentsCount,
    skippedNoSlotsCount,
  }
}

/**
 * Fetches a single MonthlyPayment snapshot by ID, scoped to the authenticated user.
 * Returns null if not found or owned by another user.
 */
export async function getMonthlyPaymentById(
  id: string
): Promise<MonthlyPaymentWithRelations | null> {
  const userId = await getAuthenticatedUserId()

  const p = await prisma.monthlyPayment.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      category: { select: { id: true, name: true } },
      account: { select: { id: true, name: true, institutionName: true } },
    },
  })

  if (!p) return null

  const sourceType = p.installmentId ? 'INSTALLMENT' : 'COMMITMENT'

  return {
    id: p.id,
    userId: p.userId,
    commitmentId: p.commitmentId,
    installmentId: p.installmentId,
    sourceType,
    paymentYear: p.paymentYear,
    paymentMonth: p.paymentMonth,
    plannedAmount: p.plannedAmount.toString(),
    actualAmount: p.actualAmount ? p.actualAmount.toString() : null,
    dueDate: p.dueDate.toISOString().slice(0, 10),
    paidDate: p.paidDate ? p.paidDate.toISOString().slice(0, 10) : null,
    status: p.status,
    variableAmount: p.variableAmount,
    transferToWife: p.transferToWife,
    sourceName: p.sourceName,
    commitmentName: p.sourceName,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    category: p.category,
    account: p.account,
  }
}

/**
 * Fetches generated MonthlyPayment snapshots for the authenticated user for a given year and month.
 * Sorted by dueDate ASC, then sourceName ASC.
 * Calculates summary metrics (Planned, Paid, Remaining, Skipped).
 */
export async function getMonthlyPayments(
  year: number,
  month: number
): Promise<MonthlyPaymentsResult> {
  const userId = await getAuthenticatedUserId()

  const resolvedMonth = `${year}-${String(month).padStart(2, '0')}`

  const rawPayments = await prisma.monthlyPayment.findMany({
    where: {
      userId,
      paymentYear: year,
      paymentMonth: month,
    },
    include: {
      category: { select: { id: true, name: true } },
      account: { select: { id: true, name: true, institutionName: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { sourceName: 'asc' }],
  })

  const payments: MonthlyPaymentWithRelations[] = rawPayments.map((p) => ({
    id: p.id,
    userId: p.userId,
    commitmentId: p.commitmentId,
    installmentId: p.installmentId,
    sourceType: p.installmentId ? 'INSTALLMENT' : 'COMMITMENT',
    paymentYear: p.paymentYear,
    paymentMonth: p.paymentMonth,
    plannedAmount: p.plannedAmount.toString(),
    actualAmount: p.actualAmount ? p.actualAmount.toString() : null,
    dueDate: p.dueDate.toISOString().slice(0, 10),
    paidDate: p.paidDate ? p.paidDate.toISOString().slice(0, 10) : null,
    status: p.status,
    variableAmount: p.variableAmount,
    transferToWife: p.transferToWife,
    sourceName: p.sourceName,
    commitmentName: p.sourceName,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    category: p.category,
    account: p.account,
  }))

  let plannedTotal = 0
  let paidTotal = 0
  let remainingTotal = 0
  let skippedTotal = 0

  for (const p of rawPayments) {
    const planned = parseFloat(p.plannedAmount.toString())
    const actual = p.actualAmount ? parseFloat(p.actualAmount.toString()) : 0

    plannedTotal += planned
    paidTotal += actual

    if (p.status === 'PAID') {
      // remaining contribution = 0
    } else if (p.status === 'SKIPPED') {
      // remaining contribution = 0
      const skippedAmount = Math.max(planned - actual, 0)
      skippedTotal += skippedAmount
    } else if (p.status === 'AMOUNT_REQUIRED') {
      remainingTotal += planned
    } else {
      // PENDING or PARTIALLY_PAID
      remainingTotal += Math.max(planned - actual, 0)
    }
  }

  const summary: MonthlyPaymentSummary = {
    plannedTotal: plannedTotal.toFixed(2),
    paidTotal: paidTotal.toFixed(2),
    remainingTotal: remainingTotal.toFixed(2),
    skippedTotal: skippedTotal.toFixed(2),
    paymentCount: payments.length,
  }

  return {
    payments,
    totalPlannedAmount: plannedTotal.toFixed(2),
    summary,
    count: payments.length,
    isPrepared: payments.length > 0,
    resolvedMonth,
  }
}

/**
 * Confirms the monthly variable amount for a payment in AMOUNT_REQUIRED status.
 * Updates plannedAmount and moves status to PENDING.
 * Leaves actualAmount and paidDate as null.
 */
export async function confirmMonthlyPaymentAmount(
  paymentId: string,
  amount: string
): Promise<void> {
  const userId = await getAuthenticatedUserId()

  const result = await prisma.monthlyPayment.updateMany({
    where: {
      id: paymentId,
      userId,
      status: PaymentStatus.AMOUNT_REQUIRED,
    },
    data: {
      plannedAmount: amount,
      status: PaymentStatus.PENDING,
    },
  })

  if (result.count === 0) {
    throw new Error('This payment could not be updated or is no longer awaiting amount confirmation.')
  }
}

/**
 * Marks a pending monthly payment as paid.
 * Atomic: If linked to an Installment, decrements Installment.remainingPayments by 1.
 * If linked to a Commitment, updates payment status only.
 */
export async function markMonthlyPaymentPaid(
  paymentId: string,
  actualAmount: string,
  paidDateStr: string
): Promise<void> {
  const userId = await getAuthenticatedUserId()

  await prisma.$transaction(async (tx) => {
    const payment = await tx.monthlyPayment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    })

    if (!payment) {
      throw new Error('Payment not found.')
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error('This payment could not be updated or has already been completed.')
    }

    if (payment.installmentId) {
      const inst = await tx.installment.findFirst({
        where: { id: payment.installmentId, userId },
      })

      if (!inst || inst.remainingPayments <= 0) {
        throw new Error('Cannot complete payment for an instalment with no remaining payments.')
      }

      const updateRes = await tx.monthlyPayment.updateMany({
        where: {
          id: paymentId,
          userId,
          status: PaymentStatus.PENDING,
        },
        data: {
          actualAmount,
          paidDate: new Date(paidDateStr),
          status: PaymentStatus.PAID,
        },
      })

      if (updateRes.count === 0) {
        throw new Error('This payment has already been modified by another process. Please refresh.')
      }

      const decRes = await tx.installment.updateMany({
        where: {
          id: payment.installmentId,
          userId,
          remainingPayments: { gt: 0 },
        },
        data: {
          remainingPayments: { decrement: 1 },
        },
      })

      if (decRes.count === 0) {
        throw new Error('Failed to update remaining payments count.')
      }
    } else {
      const updateRes = await tx.monthlyPayment.updateMany({
        where: {
          id: paymentId,
          userId,
          status: PaymentStatus.PENDING,
        },
        data: {
          actualAmount,
          paidDate: new Date(paidDateStr),
          status: PaymentStatus.PAID,
        },
      })

      if (updateRes.count === 0) {
        throw new Error('This payment could not be updated or has already been completed.')
      }
    }
  })
}

/**
 * Adds an incremental partial payment to a PENDING or PARTIALLY_PAID monthly payment.
 * Increments actualAmount. If new total >= plannedAmount, automatically completes to PAID.
 * Atomic: If transitioning to PAID for an Installment-backed payment, decrements remainingPayments by 1.
 */
export async function addPartialPayment(
  paymentId: string,
  incrementalAmountStr: string,
  completionDateStr?: string
): Promise<void> {
  const userId = await getAuthenticatedUserId()

  await prisma.$transaction(async (tx) => {
    const current = await tx.monthlyPayment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    })

    if (!current) {
      throw new Error('Payment not found.')
    }

    if (current.status !== PaymentStatus.PENDING && current.status !== PaymentStatus.PARTIALLY_PAID) {
      throw new Error('Partial payments can only be recorded on pending or partially paid obligations.')
    }

    const currentPaid = current.actualAmount ? parseFloat(current.actualAmount.toString()) : 0
    const incremental = parseFloat(incrementalAmountStr)
    const planned = parseFloat(current.plannedAmount.toString())
    const newPaid = parseFloat((currentPaid + incremental).toFixed(2))

    if (newPaid >= planned) {
      // Completing to PAID
      if (current.installmentId) {
        const inst = await tx.installment.findFirst({
          where: { id: current.installmentId, userId },
        })

        if (!inst || inst.remainingPayments <= 0) {
          throw new Error('Cannot complete payment for an instalment with no remaining payments.')
        }

        const updateRes = await tx.monthlyPayment.updateMany({
          where: {
            id: paymentId,
            userId,
            status: current.status,
          },
          data: {
            actualAmount: newPaid.toFixed(2),
            paidDate: completionDateStr ? new Date(completionDateStr) : new Date(),
            status: PaymentStatus.PAID,
          },
        })

        if (updateRes.count === 0) {
          throw new Error('This payment has already been modified by another process. Please refresh.')
        }

        const decRes = await tx.installment.updateMany({
          where: {
            id: current.installmentId,
            userId,
            remainingPayments: { gt: 0 },
          },
          data: {
            remainingPayments: { decrement: 1 },
          },
        })

        if (decRes.count === 0) {
          throw new Error('Failed to update remaining payments count.')
        }
      } else {
        const updateRes = await tx.monthlyPayment.updateMany({
          where: {
            id: paymentId,
            userId,
            status: current.status,
          },
          data: {
            actualAmount: newPaid.toFixed(2),
            paidDate: completionDateStr ? new Date(completionDateStr) : new Date(),
            status: PaymentStatus.PAID,
          },
        })

        if (updateRes.count === 0) {
          throw new Error('This payment has already been modified by another process. Please refresh.')
        }
      }
    } else {
      // Partial payment (newPaid < planned): Status becomes PARTIALLY_PAID. No decrement.
      const updateRes = await tx.monthlyPayment.updateMany({
        where: {
          id: paymentId,
          userId,
          status: current.status,
        },
        data: {
          actualAmount: newPaid.toFixed(2),
          paidDate: null,
          status: PaymentStatus.PARTIALLY_PAID,
        },
      })

      if (updateRes.count === 0) {
        throw new Error('This payment has already been modified by another process. Please refresh.')
      }
    }
  })
}

/**
 * Skips a monthly payment from AMOUNT_REQUIRED or PENDING status.
 * Sets status to SKIPPED. Leaves actualAmount and paidDate null.
 * Does NOT decrement remainingPayments.
 */
export async function skipMonthlyPayment(paymentId: string): Promise<void> {
  const userId = await getAuthenticatedUserId()

  const result = await prisma.monthlyPayment.updateMany({
    where: {
      id: paymentId,
      userId,
      status: {
        in: [PaymentStatus.AMOUNT_REQUIRED, PaymentStatus.PENDING],
      },
    },
    data: {
      status: PaymentStatus.SKIPPED,
    },
  })

  if (result.count === 0) {
    throw new Error('This payment could not be skipped or has already been updated.')
  }
}

/**
 * Skips the remaining obligation on a PARTIALLY_PAID monthly payment.
 * Sets status to SKIPPED while preserving existing actualAmount.
 * Does NOT decrement remainingPayments.
 */
export async function skipRemainingPayment(paymentId: string): Promise<void> {
  const userId = await getAuthenticatedUserId()

  const result = await prisma.monthlyPayment.updateMany({
    where: {
      id: paymentId,
      userId,
      status: PaymentStatus.PARTIALLY_PAID,
    },
    data: {
      status: PaymentStatus.SKIPPED,
    },
  })

  if (result.count === 0) {
    throw new Error('This payment could not be updated or is no longer partially paid.')
  }
}
