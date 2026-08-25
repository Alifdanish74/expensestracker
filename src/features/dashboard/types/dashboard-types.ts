import type { PaymentStatus } from '@/generated/prisma/enums'

// ── Dashboard V2 DTO types ───────────────────────────────────────────────────
// All monetary values are serialised to strings or numbers — no Prisma Decimal
// objects cross the RSC→Client component boundary.

export interface CategoryBreakdownItem {
  categoryId: string
  categoryName: string
  /** Serialised amount string (e.g. "450.00") */
  amount: string
  /** Rounded to 1 decimal place (e.g. 30.9). 0 when total expenses = 0. */
  percentage: number
}

export interface DashboardRecentTransaction {
  id: string
  description: string
  /** Serialised Decimal string (always positive, e.g. "46.80") */
  amount: string
  /** YYYY-MM-DD */
  transactionDate: string
  type: string
  essential: boolean
  category: { id: string; name: string } | null
  account: { id: string; name: string; institutionName: string | null }
}

export interface DashboardPaymentToHandle {
  id: string
  sourceName: string
  plannedAmount: string
  actualAmount: string | null
  dueDate: string
  status: PaymentStatus
  variableAmount: boolean
  transferToWife: boolean
  sourceType: 'COMMITMENT' | 'INSTALLMENT'
  isOverdue: boolean
}

export interface DashboardInstallmentPreview {
  id: string
  name: string
  monthlyAmount: string
  totalPayments: number | null
  remainingPayments: number
  dueDay: number
}

export interface DashboardV2Summary {
  month: {
    year: number
    month: number
    key: string // "YYYY-MM"
  }
  income: {
    configured: boolean
    monthlyNetIncome: string | null
  }
  actual: {
    /** Gross EXPENSE total before refunds */
    grossExpenses: string
    /** Total REFUND amount for the month */
    refunds: string
    /** grossExpenses - refunds */
    netRecordedSpending: string
    paidObligations: string
    totalPaidOutflow: string
    remainingAfterRecordedExpenses: string | null
    netRemainingAfterPaidOutflows: string | null
    categorySpending: CategoryBreakdownItem[]
    recentTransactions: DashboardRecentTransaction[]
  }
  obligations: {
    planned: string
    paid: string
    remaining: string
    needsAttentionCount: number
    isPrepared: boolean
  }
  paymentsToHandle: DashboardPaymentToHandle[]
  wifeTransfer: {
    hasItems: boolean
    readyRequired: string
    unconfirmedExpected: string
    transferred: string
    remaining: string
    excess: string
    unconfirmedCount: number
    isPrepared: boolean
  }
  installments: {
    activeCount: number
    nearCompletionCount: number
    completedCount: number
    preview: DashboardInstallmentPreview[]
  }
}

export type DashboardSummary = DashboardV2Summary
