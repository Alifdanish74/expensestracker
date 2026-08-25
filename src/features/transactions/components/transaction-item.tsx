import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import {
  getAmountColourClass,
  formatDisplayAmount,
  getTransactionTypeLabel,
  getTransactionTypeBadgeClass,
} from '../utils/transaction-type-utils'

interface TransactionItemProps {
  id: string
  description: string
  categoryName: string | null        // null for INCOME / TRANSFER / CARD_PAYMENT / REFUND
  accountName: string
  destinationAccountName: string | null  // for TRANSFER and CARD_PAYMENT
  amount: string    // serialised Decimal string, always positive
  type: string
  essential: boolean
}

export function TransactionItem({
  id,
  description,
  categoryName,
  accountName,
  destinationAccountName,
  amount,
  type,
  essential,
}: TransactionItemProps) {
  const formattedAmount = formatCurrency(amount)
  const displayAmount = formatDisplayAmount(type, formattedAmount)
  const amountColour = getAmountColourClass(type)

  // Sub-line: varies by type
  let subLine: string
  if (type === 'TRANSFER' && destinationAccountName) {
    subLine = `${accountName} → ${destinationAccountName}`
  } else if (type === 'CARD_PAYMENT' && destinationAccountName) {
    subLine = `${accountName} → ${destinationAccountName}`
  } else if (categoryName) {
    subLine = `${categoryName} • ${accountName}`
  } else {
    subLine = accountName
  }

  return (
    <Link
      href={`/transactions/${id}`}
      className="flex items-start justify-between gap-3 py-3 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 active:bg-slate-800/50 -mx-4 px-4 transition-colors cursor-pointer rounded-xl"
      aria-label={`${description}, ${displayAmount}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-medium text-slate-100 truncate">{description}</p>
          {essential && (
            <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/20">
              Essential
            </span>
          )}
          {/* Type badge — shown for non-EXPENSE types */}
          {type !== 'EXPENSE' && (
            <span className={cn(
              'flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border',
              getTransactionTypeBadgeClass(type)
            )}>
              {getTransactionTypeLabel(type)}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{subLine}</p>
      </div>
      <p className={cn('flex-shrink-0 text-sm font-semibold tabular-nums', amountColour)}>
        {displayAmount}
      </p>
    </Link>
  )
}
