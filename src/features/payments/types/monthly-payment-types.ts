import type { PaymentStatus as PrismaPaymentStatus } from '@/generated/prisma/enums'

export type PaymentStatus = PrismaPaymentStatus

export type MonthlyPaymentSourceType = 'COMMITMENT' | 'INSTALLMENT'

export interface MonthlyPaymentWithRelations {
  id: string
  userId: string
  commitmentId: string | null
  installmentId: string | null
  sourceType: MonthlyPaymentSourceType
  paymentYear: number
  paymentMonth: number
  plannedAmount: string
  actualAmount: string | null
  dueDate: string
  paidDate: string | null
  status: PaymentStatus
  variableAmount: boolean
  transferToWife: boolean
  sourceName: string
  commitmentName: string // Alias for component compatibility
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

export interface MonthlyPaymentSummary {
  plannedTotal: string
  paidTotal: string
  remainingTotal: string
  skippedTotal: string
  paymentCount: number
}

export interface MonthlyPaymentsResult {
  payments: MonthlyPaymentWithRelations[]
  totalPlannedAmount: string
  summary: MonthlyPaymentSummary
  count: number
  isPrepared: boolean
  resolvedMonth: string
}

export interface GenerationResult {
  createdCount: number
  skippedCount: number
  totalApplicableCommitments: number
  totalApplicableInstallments?: number
  skippedNoSlotsCount?: number
}
