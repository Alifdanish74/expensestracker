import Link from 'next/link'
import {
  Landmark,
  CreditCard,
  WalletCards,
  Banknote,
  HandCoins,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDay } from '@/lib/format'
import { formatAccountType } from '../utils/account-type'
import type { AccountType } from '@/generated/prisma/client'
import type { Account } from '@/generated/prisma/client'

const ACCOUNT_ICONS: Record<AccountType, React.ComponentType<{ className?: string }>> = {
  BANK_ACCOUNT: Landmark,
  CREDIT_CARD: CreditCard,
  E_WALLET: WalletCards,
  CASH: Banknote,
  FINANCING: HandCoins,
}

const TYPE_COLORS: Record<AccountType, string> = {
  BANK_ACCOUNT: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  CREDIT_CARD: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  E_WALLET: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  CASH: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  FINANCING: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
}

const ICON_BG: Record<AccountType, string> = {
  BANK_ACCOUNT: 'bg-blue-500/10 text-blue-400',
  CREDIT_CARD: 'bg-purple-500/10 text-purple-400',
  E_WALLET: 'bg-amber-500/10 text-amber-400',
  CASH: 'bg-emerald-500/10 text-emerald-400',
  FINANCING: 'bg-rose-500/10 text-rose-400',
}

interface AccountCardProps {
  account: Account
}

export function AccountCard({ account }: AccountCardProps) {
  const Icon = ACCOUNT_ICONS[account.type as AccountType]
  const isCreditCard = account.type === 'CREDIT_CARD'
  const hasDueDay = account.type === 'CREDIT_CARD' || account.type === 'FINANCING'

  const balanceNum = parseFloat(account.currentBalance.toString())
  const isNegativeBalance = balanceNum < 0

  return (
    <Link
      href={`/accounts/${account.id}`}
      className="block group"
      aria-label={`View ${account.name} account details`}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800/70 active:scale-[0.99] cursor-pointer">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
              ICON_BG[account.type as AccountType]
            )}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-100 truncate text-sm leading-tight">
                  {account.name}
                </h3>
                {account.institutionName && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{account.institutionName}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                    TYPE_COLORS[account.type as AccountType]
                  )}
                >
                  {formatAccountType(account.type as AccountType)}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            </div>

            {/* Balance row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Balance</p>
                <p
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    isNegativeBalance ? 'text-rose-400' : 'text-slate-100'
                  )}
                >
                  {formatCurrency(balanceNum)}
                </p>
              </div>

              {isCreditCard && account.creditLimit && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Limit</p>
                  <p className="text-sm font-semibold text-slate-100 tabular-nums">
                    {formatCurrency(parseFloat(account.creditLimit.toString()))}
                  </p>
                </div>
              )}

              {hasDueDay && account.dueDay && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Due</p>
                  <p className="text-sm font-semibold text-slate-100">{formatDay(account.dueDay)}</p>
                </div>
              )}

              {isCreditCard && account.statementDay && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Statement</p>
                  <p className="text-sm font-semibold text-slate-100">{formatDay(account.statementDay)}</p>
                </div>
              )}

              {isCreditCard && account.lastFourDigits && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Card</p>
                  <p className="text-sm font-semibold text-slate-100 font-mono">•••• {account.lastFourDigits}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
