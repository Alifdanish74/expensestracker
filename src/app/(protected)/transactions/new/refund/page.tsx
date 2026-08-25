import Link from 'next/link'
import { ArrowLeft, RotateCcw, Receipt } from 'lucide-react'
import {
  getExpensesForRefundForm,
  getActiveAccountsForForm,
} from '@/features/transactions/server/transaction-service'
import { RefundForm } from '@/features/transactions/components/refund-form'
import { EmptyPrerequisiteGuard } from '@/features/transactions/components/empty-prerequisite-guard'
import { createRefundAction } from '@/features/transactions/server/refund-actions'

export const metadata = {
  title: 'Record Refund — Expense Tracker',
  description: 'Record a refund linked to an original expense.',
}

interface NewRefundPageProps {
  searchParams: Promise<{ month?: string; expenseId?: string }>
}

export default async function NewRefundPage({ searchParams }: NewRefundPageProps) {
  const params = await searchParams
  const backHref = params.month ? `/transactions?month=${params.month}` : '/transactions'
  const preselectedExpenseId = params.expenseId

  const [expenses, accounts] = await Promise.all([
    getExpensesForRefundForm(),
    getActiveAccountsForForm(),
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
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
            <RotateCcw className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Record Refund</h1>
            <p className="text-sm text-slate-400 mt-0.5">Link a refund to the original expense.</p>
          </div>
        </div>

        {/* Guard: no refundable expenses */}
        {expenses.length === 0 && (
          <EmptyPrerequisiteGuard
            icon={Receipt}
            message="No refundable expenses found"
            detail="Refunds must be linked to an existing expense. Record an expense first, then come back to record a refund."
            ctaLabel="Add an Expense"
            ctaHref="/transactions/new"
          />
        )}

        {/* Form */}
        {expenses.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <RefundForm
              expenses={expenses}
              accounts={accounts}
              onSubmit={createRefundAction}
              mode="create"
              preselectedExpenseId={preselectedExpenseId}
            />
          </div>
        )}
      </div>
    </div>
  )
}
