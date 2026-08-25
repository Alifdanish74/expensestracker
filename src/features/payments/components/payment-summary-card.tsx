import { formatCurrency } from '@/lib/format'
import { SyncCommitmentsButton } from './sync-commitments-button'
import type { MonthlyPaymentSummary } from '../types/monthly-payment-types'

interface PaymentSummaryCardProps {
  summary: MonthlyPaymentSummary
  monthStr: string
}

export function PaymentSummaryCard({ summary, monthStr }: PaymentSummaryCardProps) {
  const hasSkipped = parseFloat(summary.skippedTotal) > 0

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
      {/* Top Header: Planned Total & Sync */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Planned Obligations
          </p>
          <p className="text-2xl font-bold text-white tracking-tight mt-1">
            {formatCurrency(summary.plannedTotal)}
          </p>
        </div>

        <SyncCommitmentsButton monthStr={monthStr} />
      </div>

      {/* Grid: Paid vs Remaining */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 space-y-0.5">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Paid So Far
          </p>
          <p className="text-base font-bold text-white tracking-tight">
            {formatCurrency(summary.paidTotal)}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 space-y-0.5">
          <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
            Remaining
          </p>
          <p className="text-base font-bold text-white tracking-tight">
            {formatCurrency(summary.remainingTotal)}
          </p>
        </div>
      </div>

      {/* Skipped Note if applicable */}
      {hasSkipped && (
        <p className="text-[11px] text-slate-500 italic pt-0.5">
          * Skipped obligations ({formatCurrency(summary.skippedTotal)}) are excluded from remaining.
        </p>
      )}
    </div>
  )
}
