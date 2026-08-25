import Link from 'next/link'
import { ArrowLeft, Landmark } from 'lucide-react'
import {
  getActiveAccountsForForm,
  getActiveCategoriesForForm,
} from '@/features/transactions/server/transaction-service'
import { ExpenseForm } from '@/features/transactions/components/expense-form'
import { EmptyPrerequisiteGuard } from '@/features/transactions/components/empty-prerequisite-guard'
import { createExpenseAction } from '@/features/transactions/server/transaction-actions'

export const metadata = {
  title: 'Add Expense — Expense Tracker',
  description: 'Record a new expense.',
}

interface NewTransactionPageProps {
  searchParams: Promise<{ month?: string }>
}

/**
 * Returns the first day of the given YYYY-MM month as a YYYY-MM-DD string.
 * If the month is the current or a future month, returns today's date instead.
 */
function getDefaultDate(monthParam: string | undefined): string {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  if (!monthParam) return todayStr

  const match = /^(\d{4})-(\d{2})$/.exec(monthParam)
  if (!match) return todayStr

  const year = parseInt(match[1]!, 10)
  const month = parseInt(match[2]!, 10)

  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  if (year > currentYear || (year === currentYear && month >= currentMonth)) {
    return todayStr
  }

  // For past months, pre-set to the first of that month
  return `${year}-${String(month).padStart(2, '0')}-01`
}

export default async function NewTransactionPage({ searchParams }: NewTransactionPageProps) {
  const params = await searchParams
  const monthParam = params.month

  const backHref = monthParam ? `/transactions?month=${monthParam}` : '/transactions'
  const defaultDate = getDefaultDate(monthParam)

  const [accounts, categories] = await Promise.all([
    getActiveAccountsForForm(),
    getActiveCategoriesForForm(),
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">Add Expense</h1>
          <p className="text-sm text-slate-400 mt-1">Record a new expense.</p>
        </div>

        {/* Empty-state guard: no accounts */}
        {accounts.length === 0 && (
          <EmptyPrerequisiteGuard
            icon={Landmark}
            message="No active accounts yet"
            detail="You need at least one active account before recording an expense."
            ctaLabel="Add an Account"
            ctaHref="/accounts/new"
          />
        )}

        {/* Empty-state guard: no categories (accounts exist) */}
        {accounts.length > 0 && categories.length === 0 && (
          <EmptyPrerequisiteGuard
            message="No expense categories yet"
            detail="Categories are usually seeded automatically. If they are missing, please check your settings."
            ctaLabel="Go to Settings"
            ctaHref="/settings/financial"
          />
        )}

        {/* Form card */}
        {accounts.length > 0 && categories.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <ExpenseForm
              accounts={accounts}
              categories={categories}
              onSubmit={createExpenseAction}
              mode="create"
              initialData={{ transactionDate: defaultDate }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
