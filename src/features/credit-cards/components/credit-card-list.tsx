import Link from 'next/link'
import { CreditCard, Plus } from 'lucide-react'
import type { Account } from '@/generated/prisma/client'
import { CreditCardSummaryCard } from './credit-card-summary-card'

interface CreditCardListProps {
  accounts: Account[]
}

function EmptyCreditCardState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
        <CreditCard className="h-7 w-7 text-indigo-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1.5">No credit cards yet</h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
        Add a credit-card account to track limits, balances, and statement history.
      </p>
      <Link
        href="/accounts/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl transition-all text-sm min-h-[44px] shadow-lg shadow-emerald-950/40"
      >
        <Plus className="h-4 w-4" />
        Add Account
      </Link>
    </div>
  )
}

export function CreditCardList({ accounts }: CreditCardListProps) {
  if (accounts.length === 0) {
    return <EmptyCreditCardState />
  }

  return (
    <div className="space-y-4">
      {accounts.map((account) => (
        <CreditCardSummaryCard key={account.id} account={account} />
      ))}
    </div>
  )
}
