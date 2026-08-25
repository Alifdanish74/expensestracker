import Link from 'next/link'
import { Plus, WalletCards } from 'lucide-react'
import { AccountCard } from './account-card'
import type { Account } from '@/generated/prisma/client'

interface AccountListProps {
  accounts: Account[]
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
        <WalletCards className="h-7 w-7 text-slate-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1.5">No accounts yet</h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
        Add your first bank account, credit card, e-wallet or cash account.
      </p>
      <Link
        href="/accounts/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl transition-all text-sm min-h-[44px]"
      >
        <Plus className="h-4 w-4" />
        Add Account
      </Link>
    </div>
  )
}

export function AccountList({ accounts }: AccountListProps) {
  if (accounts.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}
    </div>
  )
}
