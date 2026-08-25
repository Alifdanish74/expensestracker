import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil, Landmark, CreditCard, WalletCards, Banknote, HandCoins } from 'lucide-react'
import { getAccountById } from '@/features/accounts/server/account-service'
import { ArchiveAccountButton } from '@/features/accounts/components/archive-account-button'
import { formatCurrency, formatDay } from '@/lib/format'
import { formatAccountType } from '@/features/accounts/utils/account-type'
import { cn } from '@/lib/utils'
import type { AccountType } from '@/generated/prisma/client'

const ACCOUNT_ICONS: Record<AccountType, React.ComponentType<{ className?: string }>> = {
  BANK_ACCOUNT: Landmark,
  CREDIT_CARD: CreditCard,
  E_WALLET: WalletCards,
  CASH: Banknote,
  FINANCING: HandCoins,
}

const ICON_BG: Record<AccountType, string> = {
  BANK_ACCOUNT: 'bg-blue-500/10 text-blue-400',
  CREDIT_CARD: 'bg-purple-500/10 text-purple-400',
  E_WALLET: 'bg-amber-500/10 text-amber-400',
  CASH: 'bg-emerald-500/10 text-emerald-400',
  FINANCING: 'bg-rose-500/10 text-rose-400',
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-100 tabular-nums text-right ml-4">{value}</span>
    </div>
  )
}

interface AccountDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { id } = await params
  const account = await getAccountById(id)

  if (!account) {
    notFound()
  }

  const Icon = ACCOUNT_ICONS[account.type as AccountType]
  const isCreditCard = account.type === 'CREDIT_CARD'
  const hasDueDay = account.type === 'CREDIT_CARD' || account.type === 'FINANCING'
  const balanceNum = parseFloat(account.currentBalance.toString())
  const isNegativeBalance = balanceNum < 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">
        {/* Top bar */}
        <Link
          href="/accounts"
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm mb-6 min-h-[44px] -ml-1 px-1 w-fit"
          aria-label="Back to accounts"
        >
          <ArrowLeft className="h-4 w-4" />
          Accounts
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
              ICON_BG[account.type as AccountType]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">{account.name}</h1>
            {account.institutionName && (
              <p className="text-sm text-slate-400 mt-0.5">{account.institutionName}</p>
            )}
          </div>
        </div>

        {/* Balance hero */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Current Balance
          </p>
          <p
            className={cn(
              'text-3xl font-bold tabular-nums tracking-tight',
              isNegativeBalance ? 'text-rose-400' : 'text-white'
            )}
          >
            {formatCurrency(balanceNum)}
          </p>
          {isCreditCard && account.creditLimit && (
            <p className="text-xs text-slate-500 mt-1.5">
              Credit limit: {formatCurrency(parseFloat(account.creditLimit.toString()))}
            </p>
          )}
        </div>

        {/* Details card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 mb-4 shadow-xl">
          <DetailRow label="Type" value={formatAccountType(account.type as AccountType)} />
          {account.institutionName && (
            <DetailRow label="Institution" value={account.institutionName} />
          )}
          {isCreditCard && account.lastFourDigits && (
            <DetailRow
              label="Card number"
              value={<span className="font-mono">•••• {account.lastFourDigits}</span>}
            />
          )}
          {isCreditCard && account.creditLimit && (
            <DetailRow
              label="Credit limit"
              value={formatCurrency(parseFloat(account.creditLimit.toString()))}
            />
          )}
          {isCreditCard && account.statementDay && (
            <DetailRow label="Statement day" value={formatDay(account.statementDay)} />
          )}
          {hasDueDay && account.dueDay && (
            <DetailRow label="Due day" value={formatDay(account.dueDay)} />
          )}
        </div>

        {/* Transactions placeholder */}
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-5 mb-6 text-center">
          <p className="text-sm text-slate-500">Transactions will be available in a later version.</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href={`/accounts/${account.id}/edit`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 font-medium rounded-xl text-sm transition-all min-h-[44px]"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
          <ArchiveAccountButton accountId={account.id} accountName={account.name} />
        </div>
      </div>
    </div>
  )
}
