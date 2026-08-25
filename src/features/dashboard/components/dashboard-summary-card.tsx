import Link from 'next/link'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'

interface LegacySummaryProps {
  summary: {
    income: string | number | null
    incomeConfigured: boolean
    expenses: string
    remaining: string | null
  }
}

export function DashboardSummaryCard({ summary }: LegacySummaryProps) {
  const { income, incomeConfigured, expenses, remaining } = summary

  const remainingNum = remaining !== null ? parseFloat(remaining) : null
  const isNegative = remainingNum !== null && remainingNum < 0

  if (!incomeConfigured) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Expenses Recorded</span>
          <span className="text-sm font-semibold text-rose-400 tabular-nums">
            {formatCurrency(expenses)}
          </span>
        </div>

        <div className="border-t border-slate-800 pt-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Settings className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200">
                Monthly income hasn&apos;t been set.
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Set your monthly net income to see your remaining amount.
              </p>
            </div>
          </div>
          <Link
            href="/settings/financial"
            className="block w-full py-2.5 px-4 min-h-[44px] bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-sm font-semibold rounded-xl transition-all text-center"
          >
            Set Income
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl p-6 shadow-xl space-y-5 border',
        isNegative ? 'bg-rose-950/30 border-rose-800/50' : 'bg-slate-900 border-slate-800'
      )}
    >
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Remaining After Recorded Expenses
        </p>
        <p
          className={cn(
            'text-4xl font-bold tracking-tight tabular-nums',
            isNegative ? 'text-rose-400' : 'text-emerald-400'
          )}
        >
          {remainingNum !== null
            ? isNegative
              ? `-${formatCurrency(Math.abs(remainingNum))}`
              : formatCurrency(remainingNum)
            : '—'}
        </p>
        {isNegative && (
          <p className="text-xs text-rose-400/80 leading-relaxed">
            Your recorded expenses are higher than your configured monthly income.
          </p>
        )}
      </div>

      <div className="border-t border-slate-800/80 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Monthly Net Income</span>
          <span className="text-sm font-semibold text-slate-200 tabular-nums">
            {formatCurrency(income)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Expenses Recorded</span>
          <span className="text-sm font-semibold text-rose-400 tabular-nums">
            {formatCurrency(expenses)}
          </span>
        </div>
      </div>
    </div>
  )
}
