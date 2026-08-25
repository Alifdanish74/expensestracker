import Link from 'next/link'
import { Layers, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDay } from '@/lib/format'
import type { DashboardInstallmentPreview } from '../types/dashboard-types'

interface InstallmentProgressCardProps {
  activeCount: number
  nearCompletionCount: number
  completedCount: number
  preview: DashboardInstallmentPreview[]
}

export function InstallmentProgressCard({
  activeCount,
  nearCompletionCount,
  preview,
}: InstallmentProgressCardProps) {
  return (
    <section aria-labelledby="installments-progress-heading" className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2
            id="installments-progress-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Instalments
          </h2>
          <p className="text-[11px] text-slate-500">Current Instalment Progress</p>
        </div>
        <Link
          href="/installments"
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1 transition-colors"
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Top metrics bar */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
              <Layers className="h-3.5 w-3.5" />
              {activeCount} Active
            </span>
            {nearCompletionCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
                {nearCompletionCount} Near Completion
              </span>
            )}
          </div>
        </div>

        {/* Preview list */}
        {preview.length === 0 ? (
          <div className="text-center py-2 text-xs text-slate-400">
            No active instalments.
          </div>
        ) : (
          <div className="space-y-3.5">
            {preview.map((inst) => {
              const hasTotal = inst.totalPayments !== null && inst.totalPayments > 0
              const completedPayments = hasTotal
                ? Math.max(inst.totalPayments! - inst.remainingPayments, 0)
                : 0
              const pct = hasTotal
                ? Math.min((completedPayments / inst.totalPayments!) * 100, 100)
                : 0

              return (
                <div key={inst.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-semibold text-slate-200 truncate">{inst.name}</span>
                    <span className="font-bold text-slate-100 tabular-nums flex-shrink-0">
                      {formatCurrency(inst.monthlyAmount)}/mo
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {hasTotal
                        ? `${completedPayments} of ${inst.totalPayments} completed`
                        : `Due ${formatDay(inst.dueDay)} monthly`}
                    </span>
                    <span className="font-medium text-purple-300">
                      {inst.remainingPayments}{' '}
                      {inst.remainingPayments === 1 ? 'payment' : 'payments'} remaining
                    </span>
                  </div>

                  {/* Progress bar */}
                  {hasTotal && (
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
