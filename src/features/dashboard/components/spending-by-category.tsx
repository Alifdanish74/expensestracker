import { formatCurrency } from '@/lib/format'
import type { CategoryBreakdownItem } from '../types/dashboard-types'
import { cn } from '@/lib/utils'

interface SpendingByCategoryProps {
  breakdown: CategoryBreakdownItem[]
  /** Net recorded spending (string) — used to verify empty state */
  totalExpenses: string
}

export function SpendingByCategory({ breakdown, totalExpenses }: SpendingByCategoryProps) {
  const hasExpenses = parseFloat(totalExpenses) > 0 || breakdown.some((b) => parseFloat(b.amount) !== 0)

  return (
    <section aria-labelledby="spending-by-category-heading" className="space-y-3">
      <h2
        id="spending-by-category-heading"
        className="text-sm font-semibold text-slate-300"
      >
        Spending by Category
      </h2>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {!hasExpenses || breakdown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <p className="text-sm text-slate-400">No spending recorded for this month.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {breakdown.map((item) => {
              const amountNum = parseFloat(item.amount)
              const isNegative = amountNum < 0

              return (
                <li key={item.categoryId} className="px-4 py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {item.categoryName}
                    </span>
                    <div className="flex-shrink-0 text-right">
                      <span className={cn(
                        'text-sm font-semibold tabular-nums',
                        isNegative ? 'text-teal-400' : 'text-slate-100'
                      )}>
                        {isNegative ? `-${formatCurrency(Math.abs(amountNum))}` : formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {!isNegative ? (
                    <div className="flex items-center gap-3">
                      <div
                        className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={item.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${item.categoryName}: ${item.percentage}%`}
                      >
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 tabular-nums w-10 text-right flex-shrink-0">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-teal-400/80">Net credit (refunds exceed expenses)</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {breakdown.length === 5 && hasExpenses && (
        <p className="text-xs text-slate-600 text-center px-2">
          Showing top 5 categories by spending.
        </p>
      )}
    </section>
  )
}
