import Link from 'next/link'
import { Plus, ArrowLeft, CreditCard } from 'lucide-react'
import { getAccounts } from '@/features/accounts/server/account-service'
import { AccountList } from '@/features/accounts/components/account-list'
import { LogoutButton } from '@/components/auth/logout-button'

export const metadata = {
  title: 'Accounts — Expense Tracker',
  description: 'Manage your bank accounts, credit cards, e-wallets and cash.',
}

export default async function AccountsPage() {
  const accounts = await getAccounts()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm min-h-[44px] -ml-1 px-1"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <LogoutButton />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Accounts</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your banks, cards, cash and e-wallets.
            </p>
          </div>
          <Link
            href="/accounts/new"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl transition-all text-sm min-h-[44px] shadow-lg shadow-emerald-950/40"
            aria-label="Add new account"
          >
            <Plus className="h-4 w-4" />
            Add
          </Link>
        </div>

        {/* Dedicated Credit Cards Shortcut Banner */}
        <Link
          href="/credit-cards"
          className="flex items-center justify-between p-4 mb-6 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/50 rounded-2xl transition-all group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                Credit Card Overview
              </h2>
              <p className="text-xs text-slate-400">
                Limits, utilisation & statement history
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
            View Cards
          </span>
        </Link>

        {/* Account list */}
        <AccountList accounts={accounts} />
      </div>
    </div>
  )
}
