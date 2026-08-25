import { MonthlyPaymentCard } from './monthly-payment-card'
import { PaymentSummaryCard } from './payment-summary-card'
import type { MonthlyPaymentWithRelations, MonthlyPaymentSummary } from '../types/monthly-payment-types'

interface MonthlyPaymentListProps {
  payments: MonthlyPaymentWithRelations[]
  summary: MonthlyPaymentSummary
  monthStr: string
}

export function MonthlyPaymentList({
  payments,
  summary,
  monthStr,
}: MonthlyPaymentListProps) {
  return (
    <div className="space-y-6">
      {/* Upgraded Monthly Summary Card */}
      <PaymentSummaryCard summary={summary} monthStr={monthStr} />

      {/* Payment Cards List */}
      <div className="space-y-3">
        {payments.map((payment) => (
          <MonthlyPaymentCard key={payment.id} payment={payment} />
        ))}
      </div>
    </div>
  )
}
