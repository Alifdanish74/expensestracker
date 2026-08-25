import Link from 'next/link'
import { Calendar, Tag, CreditCard, HeartHandshake, AlertCircle, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { MonthlyPaymentWithRelations } from '../types/monthly-payment-types'
import {
  isPaymentOverdue,
  getStatusBadgeConfig,
  calculateRemainingObligation,
} from '../utils/payment-status-utils'

interface MonthlyPaymentCardProps {
  payment: MonthlyPaymentWithRelations
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function formatDueDate(dueDateStr: string): string {
  const parts = dueDateStr.slice(0, 10).split('-').map(Number)
  const month = parts[1]
  const day = parts[2]
  if (!month || !day) return dueDateStr
  const monthName = SHORT_MONTHS[month - 1] ?? ''
  return `Due ${day} ${monthName}`
}

export function MonthlyPaymentCard({ payment }: MonthlyPaymentCardProps) {
  const isOverdue = isPaymentOverdue(payment.dueDate, payment.status)
  const badgeConfig = getStatusBadgeConfig(payment.status, isOverdue)
  const dueDateFormatted = formatDueDate(payment.dueDate)
  const remaining = calculateRemainingObligation(
    payment.plannedAmount,
    payment.actualAmount,
    payment.status
  )

  const isInstalment = payment.sourceType === 'INSTALLMENT' || !!payment.installmentId

  return (
    <Link
      href={`/payments/${payment.id}`}
      className="block bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all hover:border-slate-700 active:bg-slate-800/80 space-y-3 group"
    >
      {/* Top Row: Name & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-semibold text-white tracking-tight truncate group-hover:text-amber-300 transition-colors">
              {payment.sourceName || payment.commitmentName}
            </h3>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isInstalment
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              }`}
            >
              {isInstalment ? 'Instalment' : 'Commitment'}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>{dueDateFormatted}</span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badgeConfig.className}`}
          >
            {badgeConfig.label}
          </span>
          {badgeConfig.secondaryLabel && badgeConfig.secondaryClassName && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeConfig.secondaryClassName}`}
            >
              {badgeConfig.secondaryLabel}
            </span>
          )}
        </div>
      </div>

      {/* Middle Row: Financial Amounts */}
      <div className="flex items-baseline justify-between pt-1">
        <div className="text-xs text-slate-400 font-medium">
          {payment.status === 'PARTIALLY_PAID' ? (
            <span className="text-slate-300">
              Paid <span className="font-semibold text-emerald-400">{formatCurrency(payment.actualAmount ?? '0.00')}</span>
              {' • '}
              Remaining <span className="font-semibold text-blue-400">{formatCurrency(remaining)}</span>
            </span>
          ) : payment.status === 'PAID' && payment.actualAmount ? (
            <span className="text-slate-400">
              Actual Paid: <span className="font-semibold text-emerald-400">{formatCurrency(payment.actualAmount)}</span>
            </span>
          ) : (
            <span>Planned Amount</span>
          )}
        </div>

        <div className="text-right">
          <span className="text-base font-bold text-white tracking-tight">
            {formatCurrency(payment.plannedAmount)}
          </span>
          {payment.variableAmount && payment.status === 'AMOUNT_REQUIRED' && (
            <span className="block text-[10px] text-amber-400 font-medium mt-0.5">
              expected
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row: Metadata Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 text-[11px]">
          <Tag className="h-3 w-3 text-slate-400" />
          {payment.category.name}
        </span>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 text-[11px]">
          <CreditCard className="h-3 w-3 text-slate-400" />
          {payment.account ? payment.account.name : 'No default account'}
        </span>

        {payment.transferToWife && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-medium">
            <HeartHandshake className="h-3 w-3 text-purple-400" />
            Transfer to Wife
          </span>
        )}

        {payment.variableAmount && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
            <AlertCircle className="h-3 w-3 text-amber-400" />
            Variable
          </span>
        )}
      </div>
    </Link>
  )
}
