import Link from 'next/link'
import { Plus, ArrowLeft } from 'lucide-react'
import { getCreditCards } from '@/features/credit-cards/server/credit-card-service'
import { CreditCardList } from '@/features/credit-cards/components/credit-card-list'
import { LogoutButton } from '@/components/auth/logout-button'

export const metadata = {
  title: 'Credit Cards — Expense Tracker',
  description: 'Track limits, balance semantics, utilisation, and statement history for credit cards.',
}

export default async function CreditCardsPage() {
  const cards = await getCreditCards()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Credit Cards</h1>
            <p className="text-sm text-slate-400 mt-1">
              Limits, utilisation, and historical statements.
            </p>
          </div>
          <Link
            href="/accounts/new"
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl transition-all text-sm min-h-[44px] shadow-lg shadow-emerald-950/40"
            aria-label="Add new account"
          >
            <Plus className="h-4 w-4" />
            Add Card
          </Link>
        </div>

        {/* Card List */}
        <CreditCardList accounts={cards} />
      </div>
    </div>
  )
}
