import Link from 'next/link'
import { CalendarDays, AlertCircle, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

interface MonthlyObligationsCardProps {
  planned: string
  paid: string
  remaining: string
  needsAttentionCount: number
  isPrepared: boolean
  monthKey: string
}

export function MonthlyObligationsCard({
  planned,
  paid,
  remaining,
  needsAttentionCount,
  isPrepared,
  monthKey,
}: MonthlyObligationsCardProps) {
  const paymentsHref = `/payments?month=${monthKey}`

  return (
    <section aria-labelledby="monthly-obligations-heading" className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2
            id="monthly-obligations-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Monthly Obligations
          </h2>
          <p className="text-[11px] text-slate-500">Based on monthly payment plans</p>
        </div>
        <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <CalendarDays className="h-3.5 w-3.5 text-blue-400" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {!isPrepared ? (
          <div className="text-center py-3 space-y-3">
            <p className="text-xs text-slate-400">No monthly payments prepared for this month.</p>
            <Link
              href={paymentsHref}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition-all min-h-[36px]"
            >
              View Payments
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Planned Total */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Planned Obligations</span>
              <span className="text-lg font-bold text-slate-100 tabular-nums">
                {formatCurrency(planned)}
              </span>
            </div>

            {/* Paid vs Remaining Breakdown */}
            <div className="border-t border-slate-800 pt-3.5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Paid
                </p>
                <p className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">
                  {formatCurrency(paid)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Remaining
                </p>
                <p className="text-sm font-bold text-amber-400 tabular-nums mt-0.5">
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>

            {/* Needs Attention Badge & View Link */}
            <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between gap-2 flex-wrap">
              {needsAttentionCount > 0 ? (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    {needsAttentionCount} {needsAttentionCount === 1 ? 'payment needs' : 'payments need'} attention
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-500">All payments up to date</span>
              )}

              <Link
                href={paymentsHref}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors ml-auto"
              >
                View Payments
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
