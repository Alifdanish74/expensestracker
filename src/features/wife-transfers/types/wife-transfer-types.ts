import type { PaymentStatus } from '@/generated/prisma/enums'

export interface WifeTransferRecord {
  id: string
  userId: string
  paymentYear: number
  paymentMonth: number
  amount: string
  transferDate: string
  sourceAccountId: string | null
  sourceAccountName: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface WifeTransferPaymentItem {
  id: string
  commitmentName: string
  plannedAmount: string
  actualAmount: string | null
  status: PaymentStatus
  dueDate: string
  variableAmount: boolean
  transferToWife: boolean
  category: {
    id: string
    name: string
  }
  account: {
    id: string
    name: string
  } | null
}

export interface WifeTransferSummary {
  resolvedMonth: string
  year: number
  month: number
  readyRequiredTotal: string
  unconfirmedExpectedTotal: string
  transferredTotal: string
  remainingTotal: string
  excessTotal: string
  unconfirmedCount: number
  paymentCount: number
  includedItems: WifeTransferPaymentItem[]
  unconfirmedItems: WifeTransferPaymentItem[]
  skippedItems: WifeTransferPaymentItem[]
  transfers: WifeTransferRecord[]
  isPrepared: boolean
}
