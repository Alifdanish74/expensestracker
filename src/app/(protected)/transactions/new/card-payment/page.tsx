import Link from 'next/link'
import { ArrowLeft, CreditCard, Landmark } from 'lucide-react'
import {
  getActiveNonCreditCardAccountsForForm,
  getCreditCardAccountsForForm,
} from '@/features/transactions/server/transaction-service'
import { CardPaymentForm } from '@/features/transactions/components/card-payment-form'
import { EmptyPrerequisiteGuard } from '@/features/transactions/components/empty-prerequisite-guard'
import { createCardPaymentAction } from '@/features/transactions/server/card-payment-actions'

export const metadata = {
  title: 'Pay Credit Card — Expense Tracker',
  description: 'Record a credit card payment from your bank account.',
}

interface NewCardPaymentPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function NewCardPaymentPage({ searchParams }: NewCardPaymentPageProps) {
  const params = await searchParams
  const backHref = params.month ? `/transactions?month=${params.month}` : '/transactions'

  const [sourceAccounts, creditCards] = await Promise.all([
    getActiveNonCreditCardAccountsForForm(),
    getCreditCardAccountsForForm(),
  ])

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
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Pay Credit Card</h1>
            <p className="text-sm text-slate-400 mt-0.5">Settle a credit card from your bank account.</p>
          </div>
        </div>

        {/* Guard: no source (bank) accounts */}
        {sourceAccounts.length === 0 && (
          <EmptyPrerequisiteGuard
            icon={Landmark}
            message="No active bank accounts yet"
            detail="You need at least one active non-credit-card account to pay from."
            ctaLabel="Add an Account"
            ctaHref="/accounts/new"
          />
        )}

        {/* Guard: no credit cards (source accounts exist) */}
        {sourceAccounts.length > 0 && creditCards.length === 0 && (
          <EmptyPrerequisiteGuard
            icon={CreditCard}
            message="No active credit cards yet"
            detail="Add a credit card account first. Go to Accounts → Add → select Credit Card as the type."
            ctaLabel="Add a Credit Card"
            ctaHref="/accounts/new"
          />
        )}

        {/* Form */}
        {sourceAccounts.length > 0 && creditCards.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <CardPaymentForm
              sourceAccounts={sourceAccounts}
              creditCards={creditCards}
              onSubmit={createCardPaymentAction}
              mode="create"
            />
          </div>
        )}
      </div>
    </div>
  )
}
