import type { PaymentStatus } from '../types/monthly-payment-types'

/**
 * Returns today's date formatted as "YYYY-MM-DD" in local time zone.
 */
export function getTodayDateString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Determines whether a payment is effectively overdue.
 *
 * Rules:
 * - Overdue if dueDate < start of today (local calendar date).
 * - Payment due today is NOT overdue.
 * - Only actionable statuses (PENDING, AMOUNT_REQUIRED, PARTIALLY_PAID) can be overdue.
 * - Terminal statuses (PAID, SKIPPED) are NEVER overdue.
 */
export function isPaymentOverdue(
  dueDateStr: string,
  status: PaymentStatus,
  todayStr: string = getTodayDateString()
): boolean {
  if (status === 'PAID' || status === 'SKIPPED') {
    return false
  }

  const cleanDueDate = dueDateStr.slice(0, 10)
  const cleanToday = todayStr.slice(0, 10)

  return cleanDueDate < cleanToday
}

/**
 * Calculates the remaining financial obligation for a single MonthlyPayment.
 *
 * Rules:
 * - PAID -> 0
 * - SKIPPED -> 0 (even if plannedAmount > actualAmount, intentional skip removes obligation)
 * - PENDING -> max(plannedAmount - (actualAmount ?? 0), 0)
 * - AMOUNT_REQUIRED -> plannedAmount (current reference amount)
 * - PARTIALLY_PAID -> max(plannedAmount - (actualAmount ?? 0), 0)
 */
export function calculateRemainingObligation(
  plannedAmountStr: string | number,
  actualAmountStr: string | number | null,
  status: PaymentStatus
): number {
  if (status === 'PAID' || status === 'SKIPPED') {
    return 0
  }

  const planned = typeof plannedAmountStr === 'number' ? plannedAmountStr : parseFloat(plannedAmountStr)
  const actual = actualAmountStr !== null ? (typeof actualAmountStr === 'number' ? actualAmountStr : parseFloat(actualAmountStr)) : 0

  if (status === 'AMOUNT_REQUIRED') {
    return Math.max(planned, 0)
  }

  return Math.max(planned - actual, 0)
}

export interface StatusBadgeConfig {
  label: string
  className: string
  isOverdue: boolean
  secondaryLabel?: string
  secondaryClassName?: string
}

/**
 * Returns accessible badge display configuration for effective payment status.
 */
export function getStatusBadgeConfig(
  status: PaymentStatus,
  isOverdue: boolean
): StatusBadgeConfig {
  switch (status) {
    case 'PAID':
      return {
        label: 'Paid',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        isOverdue: false,
      }
    case 'SKIPPED':
      return {
        label: 'Skipped',
        className: 'bg-slate-800 text-slate-400 border-slate-700',
        isOverdue: false,
      }
    case 'AMOUNT_REQUIRED':
      return {
        label: 'Amount Required',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        isOverdue,
        secondaryLabel: isOverdue ? 'Overdue' : undefined,
        secondaryClassName: isOverdue ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : undefined,
      }
    case 'PARTIALLY_PAID':
      return {
        label: 'Partially Paid',
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        isOverdue,
        secondaryLabel: isOverdue ? 'Overdue' : undefined,
        secondaryClassName: isOverdue ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : undefined,
      }
    case 'PENDING':
    default:
      if (isOverdue) {
        return {
          label: 'Overdue',
          className: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          isOverdue: true,
        }
      }
      return {
        label: 'Pending',
        className: 'bg-slate-800 text-slate-300 border-slate-700',
        isOverdue: false,
      }
  }
}
