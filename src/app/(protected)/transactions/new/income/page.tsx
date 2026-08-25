import Link from 'next/link'
import { ArrowLeft, TrendingUp, Landmark } from 'lucide-react'
import { getActiveNonCreditCardAccountsForForm } from '@/features/transactions/server/transaction-service'
import { IncomeForm } from '@/features/transactions/components/income-form'
import { EmptyPrerequisiteGuard } from '@/features/transactions/components/empty-prerequisite-guard'
import { createIncomeAction } from '@/features/transactions/server/income-actions'

export const metadata = {
  title: 'Record Income — Expense Tracker',
  description: 'Record a new income transaction.',
}

interface NewIncomePageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function NewIncomePage({ searchParams }: NewIncomePageProps) {
  const params = await searchParams
  const backHref = params.month ? `/transactions?month=${params.month}` : '/transactions'

  const accounts = await getActiveNonCreditCardAccountsForForm()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">
        {/* Back */}
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm mb-6 min-h-[44px] -ml-1 px-1 w-fit"
          aria-label="Back to transactions"
        >
          <ArrowLeft className="h-4 w-4" />
          Transactions
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Record Income</h1>
            <p className="text-sm text-slate-400 mt-0.5">Log money received into an account.</p>
          </div>
        </div>

        {/* Empty state guard */}
        {accounts.length === 0 ? (
          <EmptyPrerequisiteGuard
            icon={Landmark}
            message="No active accounts yet"
            detail="You need at least one active non-credit-card account to record income."
            ctaLabel="Add an Account"
            ctaHref="/accounts/new"
          />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <IncomeForm accounts={accounts} onSubmit={createIncomeAction} mode="create" />
          </div>
        )}
      </div>
    </div>
  )
}
