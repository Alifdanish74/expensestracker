import Link from 'next/link'
import { Calendar, Tag, CreditCard, ExternalLink, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { WifeTransferPaymentItem } from '../types/wife-transfer-types'

interface WifeTransferItemListProps {
  includedItems: WifeTransferPaymentItem[]
  unconfirmedItems: WifeTransferPaymentItem[]
  skippedItems: WifeTransferPaymentItem[]
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

function getItemBadge(status: string) {
  switch (status) {
    case 'PAID':
      return { label: 'Paid', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
    case 'PARTIALLY_PAID':
      return { label: 'Partially Paid', className: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
    case 'AMOUNT_REQUIRED':
      return { label: 'Amount Required', className: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
    case 'SKIPPED':
      return { label: 'Skipped', className: 'bg-slate-800 text-slate-400 border-slate-700' }
    case 'PENDING':
    default:
      return { label: 'Pending', className: 'bg-slate-800 text-slate-300 border-slate-700' }
  }
}

export function WifeTransferItemList({
  includedItems,
  unconfirmedItems,
  skippedItems,
}: WifeTransferItemListProps) {
  return (
    <div className="space-y-6">
      {/* Section 1: Needs Amount Confirmation */}
      {unconfirmedItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-400 tracking-tight">
              Needs Amount Confirmation ({unconfirmedItems.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {unconfirmedItems.map((item) => {
              const badge = getItemBadge(item.status)
              return (
                <div
                  key={item.id}
                  className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-bold text-white tracking-tight truncate">
                        {item.commitmentName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>{formatDueDate(item.dueDate)}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-400 font-medium">Expected Amount</span>
                    <span className="text-sm font-bold text-amber-400">
                      {formatCurrency(item.plannedAmount)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-amber-500/10 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{item.category.name}</span>
                    <Link
                      href={`/payments/${item.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <span>Confirm in Payments</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Section 2: Included This Month */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white tracking-tight">
          Included Obligations ({includedItems.length})
        </h3>

        {includedItems.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-center text-xs text-slate-400">
            No active transfer-to-wife obligations included for this month yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {includedItems.map((item) => {
              const badge = getItemBadge(item.status)
              return (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white tracking-tight truncate">
                        {item.commitmentName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>{formatDueDate(item.dueDate)}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 text-xs">
                    <span className="text-slate-400 font-medium">Planned Obligation</span>
                    <span className="text-sm font-bold text-white tracking-tight">
                      {formatCurrency(item.plannedAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800">
                      <Tag className="h-3 w-3 text-slate-400" />
                      {item.category.name}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800">
                      <CreditCard className="h-3 w-3 text-slate-400" />
                      {item.account ? item.account.name : 'No default account'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 3: Skipped This Month */}
      {skippedItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Skipped This Month ({skippedItems.length})
          </h3>

          <div className="space-y-2">
            {skippedItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between text-xs opacity-75"
              >
                <div>
                  <p className="font-semibold text-slate-300">{item.commitmentName}</p>
                  <p className="text-[11px] text-slate-500">{item.category.name}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-400">{formatCurrency(item.plannedAmount)}</span>
                  <span className="block text-[10px] text-slate-500">Skipped</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
