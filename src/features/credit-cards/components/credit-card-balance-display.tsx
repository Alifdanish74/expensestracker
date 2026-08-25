import { getCreditCardBalanceState } from '../utils/credit-card-calculations'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface CreditCardBalanceDisplayProps {
  currentBalance: unknown
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CreditCardBalanceDisplay({
  currentBalance,
  size = 'md',
  className,
}: CreditCardBalanceDisplayProps) {
  const state = getCreditCardBalanceState(currentBalance)

  const sizeClasses = {
    sm: {
      label: 'text-xs',
      amount: 'text-lg font-bold',
      badge: 'text-[10px] px-1.5 py-0.5',
    },
    md: {
      label: 'text-xs font-medium',
      amount: 'text-2xl font-bold',
      badge: 'text-xs px-2 py-0.5',
    },
    lg: {
      label: 'text-sm font-medium',
      amount: 'text-3xl font-extrabold',
      badge: 'text-xs px-2.5 py-1',
    },
  }[size]

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-2">
        <span className={cn('text-slate-400', sizeClasses.label)}>
          {state.label}
        </span>
        {state.secondaryBadge && (
          <span
            className={cn(
              'rounded-full font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
              sizeClasses.badge
            )}
          >
            {state.secondaryBadge}
          </span>
        )}
      </div>
      <div
        className={cn(
          'tabular-nums tracking-tight',
          sizeClasses.amount,
          state.type === 'credit'
            ? 'text-emerald-400'
            : state.type === 'outstanding'
            ? 'text-slate-100'
            : 'text-slate-300'
        )}
      >
        {formatCurrency(state.displayAmount)}
      </div>
    </div>
  )
}
