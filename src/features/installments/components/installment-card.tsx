import Link from 'next/link'
import { Calendar, CreditCard, Tag, ChevronRight, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDay } from '@/lib/format'
import { computeInstallmentProgress } from '../utils/installment-progress'
import type { InstallmentWithRelations } from '../server/installment-service'

interface InstallmentCardProps {
  installment: InstallmentWithRelations
}

export function InstallmentCard({ installment }: InstallmentCardProps) {
  const { id, name, monthlyAmount, totalPayments, remainingPayments, dueDay, category, account } =
    installment

  const isCompleted = remainingPayments === 0
  const progress = computeInstallmentProgress(totalPayments, remainingPayments)

  return (
    <Link
      href={`/installments/${id}`}
      className="block bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all hover:bg-slate-800/60 active:bg-slate-800/80 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-100 text-base group-hover:text-indigo-400 transition-colors leading-snug">
              {name}
            </h3>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Tag className="h-3 w-3 text-slate-500 flex-shrink-0" />
            {category.name}
          </p>
        </div>

        <div className="text-right flex-shrink-0 flex items-center gap-2">
          <div>
            <span className="text-base font-bold text-slate-100 tabular-nums block">
              {formatCurrency(monthlyAmount)}
            </span>
            <span className="text-[11px] text-slate-500 block">/ payment</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors hidden sm:block" />
        </div>
      </div>

      {/* Progress / Remaining Count */}
      <div className="mt-3">
        {isCompleted ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                All payments completed
              </span>
              <span className="font-semibold text-slate-400 tabular-nums">0 remaining</span>
            </div>
            <div
              className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={100}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="100% completed"
            >
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        ) : progress.hasTotal ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                <span className="font-semibold text-indigo-400 tabular-nums">{progress.completed}</span>
                {' '}of{' '}
                <span className="tabular-nums">{progress.total}</span>
                {' '}completed
              </span>
              <span className="font-semibold text-slate-200 tabular-nums">
                {progress.remaining} remaining
              </span>
            </div>
            <div
              className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(progress.percentage)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${Math.round(progress.percentage)}% completed`}
            >
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs font-semibold text-slate-300 tabular-nums">
            <span className="text-indigo-400">{progress.remaining}</span>{' '}
            {progress.remaining === 1 ? 'payment' : 'payments'} remaining
          </p>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-3 flex-wrap text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>Due {formatDay(dueDay)}</span>
        </div>

        {account ? (
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-slate-500" />
            <span className="truncate max-w-[130px] sm:max-w-[180px]">{account.name}</span>
          </div>
        ) : null}
      </div>
    </Link>
  )
}
