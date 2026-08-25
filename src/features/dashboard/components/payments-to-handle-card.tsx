import Link from 'next/link'
import { CheckCircle2, ArrowRight, Clock, HeartHandshake } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { getStatusBadgeConfig } from '@/features/payments/utils/payment-status-utils'
import type { DashboardPaymentToHandle } from '../types/dashboard-types'

interface PaymentsToHandleCardProps {
  payments: DashboardPaymentToHandle[]
  monthKey: string
}

export function PaymentsToHandleCard({ payments, monthKey }: PaymentsToHandleCardProps) {
  const paymentsHref = `/payments?month=${monthKey}`

  return (
    <section aria-labelledby="payments-to-handle-heading" className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2
          id="payments-to-handle-heading"
          className="text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          Payments to Handle
        </h2>
        <Link
          href={paymentsHref}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors"
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-slate-200">You&apos;re caught up for this month!</p>
            <p className="text-xs text-slate-500">No payments currently require attention.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/80">
            {payments.map((p) => {
              const badgeConfig = getStatusBadgeConfig(p.status, p.isOverdue)
              const actualPaid = p.actualAmount ? parseFloat(p.actualAmount) : 0
              const plannedAmt = parseFloat(p.plannedAmount)
              const remainingAmt = Math.max(plannedAmt - actualPaid, 0)

              const [, mStr, dStr] = p.dueDate.split('-')
              const monthNames = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
              ]
              const formattedDueDate = `${parseInt(dStr ?? '1', 10)} ${monthNames[parseInt(mStr ?? '1', 10) - 1]}`

              return (
                <li key={p.id}>
                  <Link
                    href={paymentsHref}
                    className="block p-4 hover:bg-slate-800/50 active:bg-slate-800 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-slate-100 truncate">
                            {p.sourceName}
                          </span>

                          {/* Source type badge */}
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                              p.sourceType === 'INSTALLMENT'
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {p.sourceType === 'INSTALLMENT' ? 'Instalment' : 'Commitment'}
                          </span>

                          {/* Wife Transfer badge */}
                          {p.transferToWife && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                              <HeartHandshake className="h-2.5 w-2.5" />
                              Wife
                            </span>
                          )}
                        </div>

                        {/* Due date */}
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3 text-slate-500 flex-shrink-0" />
                          <span>Due {formattedDueDate}</span>
                        </div>
                      </div>

                      {/* Right amount & badge */}
                      <div className="text-right flex-shrink-0 space-y-1">
                        <p className="text-sm font-bold text-slate-100 tabular-nums">
                          {formatCurrency(p.plannedAmount)}
                        </p>

                        <span
                          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeConfig.className}`}
                        >
                          {badgeConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Partial payment progress detail */}
                    {p.status === 'PARTIALLY_PAID' && (
                      <div className="text-xs text-slate-400 bg-slate-950/40 rounded-lg p-2 flex justify-between items-center">
                        <span>Paid: {formatCurrency(actualPaid)}</span>
                        <span className="font-medium text-amber-400">
                          Remaining: {formatCurrency(remainingAmt)}
                        </span>
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
