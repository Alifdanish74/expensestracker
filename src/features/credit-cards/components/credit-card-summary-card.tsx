import Link from 'next/link'
import { CreditCard, ChevronRight, Landmark } from 'lucide-react'
import type { Account } from '@/generated/prisma/client'
import { CreditCardBalanceDisplay } from './credit-card-balance-display'
import { CreditUtilisationBar } from './credit-utilisation-bar'
import { calculateEstimatedAvailableCredit } from '../utils/credit-card-calculations'
import { formatCurrency, formatDay } from '@/lib/format'

interface CreditCardSummaryCardProps {
  account: Account
}

export function CreditCardSummaryCard({ account }: CreditCardSummaryCardProps) {
  const estimatedAvailable = calculateEstimatedAvailableCredit(
    account.currentBalance,
    account.creditLimit
  )

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 hover:border-slate-700 transition-all shadow-md">
      {/* Header: Institution + Name + Last 4 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 line-clamp-1">
              {account.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              {account.institutionName && (
                <span className="flex items-center gap-1">
                  <Landmark className="h-3 w-3 text-slate-500" />
                  {account.institutionName}
                </span>
              )}
              {account.lastFourDigits && (
                <span className="font-mono text-slate-400">
                  •••• {account.lastFourDigits}
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/credit-cards/${account.id}`}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors py-1 px-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 min-h-[36px]"
          aria-label={`View ${account.name} details`}
        >
          View Card
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Balance Section */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
        <CreditCardBalanceDisplay currentBalance={account.currentBalance} size="md" />
      </div>

      {/* Limit & Estimated Available Credit */}
      <div className="grid grid-cols-2 gap-3 text-xs pt-0.5">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2.5 space-y-0.5">
          <span className="text-slate-400">Credit Limit</span>
          <p className="font-semibold text-slate-200 tabular-nums">
            {account.creditLimit != null
              ? formatCurrency(account.creditLimit)
              : 'Not configured'}
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2.5 space-y-0.5">
          <span className="text-slate-400">Est. Available Credit</span>
          <p className="font-semibold text-slate-200 tabular-nums">
            {estimatedAvailable != null
              ? formatCurrency(estimatedAvailable)
              : 'Not available'}
          </p>
        </div>
      </div>

      {/* Utilisation Bar */}
      <CreditUtilisationBar
        currentBalance={account.currentBalance}
        creditLimit={account.creditLimit}
      />

      {/* Statement & Due Days Footer */}
      {(account.statementDay != null || account.dueDay != null) && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
          <span>
            Statement Day: <strong className="text-slate-200">{formatDay(account.statementDay)}</strong>
          </span>
          <span>
            Due Day: <strong className="text-slate-200">{formatDay(account.dueDay)}</strong>
          </span>
        </div>
      )}
    </div>
  )
}
