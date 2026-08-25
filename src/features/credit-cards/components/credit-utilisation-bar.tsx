import { calculateCreditUtilisation } from '../utils/credit-card-calculations'
import { cn } from '@/lib/utils'

interface CreditUtilisationBarProps {
  currentBalance: unknown
  creditLimit: unknown
  showBar?: boolean
  className?: string
}

export function CreditUtilisationBar({
  currentBalance,
  creditLimit,
  showBar = true,
  className,
}: CreditUtilisationBarProps) {
  const utilisation = calculateCreditUtilisation(currentBalance, creditLimit)

  if (utilisation === null) {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Utilisation</span>
          <span className="text-slate-500 font-medium">Not available</span>
        </div>
      </div>
    )
  }

  // Graphical width is clamped to 100% for visual safety, text remains accurate (e.g. 110%)
  const visualWidth = Math.min(Math.max(0, utilisation), 100)

  // Subtle visual warmth indicator if > 70% or > 90% (facts-only, no advice text)
  const barColor =
    utilisation > 90
      ? 'bg-amber-500'
      : utilisation > 70
      ? 'bg-indigo-500'
      : 'bg-emerald-500'

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400 font-medium">Utilisation</span>
        <span className="font-semibold text-slate-200 tabular-nums">
          {utilisation.toFixed(1)}%
        </span>
      </div>
      {showBar && (
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={cn('h-full rounded-full transition-all duration-300', barColor)}
            style={{ width: `${visualWidth}%` }}
            role="progressbar"
            aria-valuenow={Math.round(utilisation)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Credit utilisation percentage"
          />
        </div>
      )}
    </div>
  )
}
