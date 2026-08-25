import Link from 'next/link'
import { ArrowLeft, ArrowLeftRight, Landmark } from 'lucide-react'
import { getActiveNonCreditCardAccountsForForm } from '@/features/transactions/server/transaction-service'
import { TransferForm } from '@/features/transactions/components/transfer-form'
import { EmptyPrerequisiteGuard } from '@/features/transactions/components/empty-prerequisite-guard'
import { createTransferAction } from '@/features/transactions/server/transfer-actions'

export const metadata = {
  title: 'Transfer Money — Expense Tracker',
  description: 'Record a transfer between your accounts.',
}

interface NewTransferPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function NewTransferPage({ searchParams }: NewTransferPageProps) {
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
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <ArrowLeftRight className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Transfer Money</h1>
            <p className="text-sm text-slate-400 mt-0.5">Move funds between your own accounts.</p>
          </div>
        </div>

        {/* Empty state guard: need at least 2 accounts for a transfer */}
        {accounts.length < 2 ? (
          <EmptyPrerequisiteGuard
            icon={Landmark}
            message={
              accounts.length === 0
                ? 'No active accounts yet'
                : 'You need at least two accounts to record a transfer'
            }
            detail={
              accounts.length === 0
                ? 'Add at least two active non-credit-card accounts to transfer between them.'
                : 'A transfer requires a source and a destination account. Add another account to continue.'
            }
            ctaLabel="Add an Account"
            ctaHref="/accounts/new"
          />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <TransferForm accounts={accounts} onSubmit={createTransferAction} mode="create" />
          </div>
        )}
      </div>
    </div>
  )
}
