import { AlertTriangle, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'

interface ActualSpendingCardProps {
  grossExpenses: string
  refunds: string
  netRecordedSpending: string
  paidObligations: string
  totalPaidOutflow: string
  remainingAfterRecordedExpenses: string | null
  netRemainingAfterPaidOutflows: string | null
  incomeConfigured: boolean
}

export function ActualSpendingCard({
  grossExpenses,
  refunds,
  netRecordedSpending,
  paidObligations,
  totalPaidOutflow,
  netRemainingAfterPaidOutflows,
  incomeConfigured,
}: ActualSpendingCardProps) {
  const netRemainingNum =
    netRemainingAfterPaidOutflows !== null ? parseFloat(netRemainingAfterPaidOutflows) : null
  const isNegative = netRemainingNum !== null && netRemainingNum < 0
  const refundsNum = parseFloat(refunds)
  const hasRefunds = refundsNum > 0

  return (
    <section aria-labelledby="actual-spending-heading" className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2
            id="actual-spending-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Actual Spending &amp; Paid Outflows
          </h2>
          <p className="text-[11px] text-slate-500">
            Recorded transactions + paid monthly obligations
          </p>
        </div>
        <div className="w-6 h-6 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
        </div>
      </div>

      <div
        className={cn(
          'rounded-2xl p-5 border shadow-sm space-y-4',
          isNegative
            ? 'bg-rose-950/20 border-rose-800/40'
            : 'bg-slate-900 border-slate-800'
        )}
      >
        {/* Primary Metric: Net Remaining After Paid Outflows */}
        {incomeConfigured && netRemainingNum !== null ? (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Net Money Left For Month
            </p>
            <p
              className={cn(
                'text-3xl font-bold tracking-tight tabular-nums',
                isNegative ? 'text-rose-400' : 'text-emerald-400'
              )}
            >
              {isNegative
                ? `-${formatCurrency(Math.abs(netRemainingNum))}`
                : formatCurrency(netRemainingNum)}
            </p>
            <p className="text-xs text-slate-400">
              Income minus net spending &amp; paid obligations.
            </p>
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            Configure monthly net income in settings to view net money left.
          </div>
        )}

        {/* Breakdown of Outflows */}
        <div className="border-t border-slate-800/80 pt-3.5 space-y-2.5">
          {hasRefunds ? (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Gross Expenses</span>
                <span className="font-semibold text-rose-400/80 tabular-nums">
                  {formatCurrency(grossExpenses)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Refunds</span>
                <span className="font-semibold text-teal-400 tabular-nums">
                  −{formatCurrency(refunds)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Net Recorded Spending</span>
                <span className="font-semibold text-rose-400 tabular-nums">
                  {formatCurrency(netRecordedSpending)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Expenses Recorded (Transactions)</span>
              <span className="font-semibold text-rose-400 tabular-nums">
                {formatCurrency(netRecordedSpending)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Paid Obligations (Bills/Instalments)</span>
            <span className="font-semibold text-purple-400 tabular-nums">
              {formatCurrency(paidObligations)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/50">
            <span className="font-semibold text-slate-300">Total Paid Outflow</span>
            <span className="font-bold text-slate-100 tabular-nums">
              {formatCurrency(totalPaidOutflow)}
            </span>
          </div>
        </div>

        {isNegative && (
          <div className="flex items-center gap-1.5 pt-1 text-xs text-rose-400/90">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Total paid outflows exceed configured monthly income.</span>
          </div>
        )}
      </div>
    </section>
  )
}
