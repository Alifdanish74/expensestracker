import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AccountForm } from '@/features/accounts/components/account-form'
import { createAccountAction } from '@/features/accounts/server/account-actions'

export const metadata = {
  title: 'Add Account — Expense Tracker',
  description: 'Create a new bank account, credit card, e-wallet or cash account.',
}

export default function NewAccountPage() {
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">Add Account</h1>
          <p className="text-sm text-slate-400 mt-1">
            Add a new account to track your finances.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <AccountForm
            onSubmit={createAccountAction}
            submitLabel="Save Account"
          />
        </div>
      </div>
    </div>
  )
}
