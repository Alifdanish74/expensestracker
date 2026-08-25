import Link from 'next/link'
import { Plus } from 'lucide-react'
import { TransactionItem } from '@/features/transactions/components/transaction-item'
import type { DashboardRecentTransaction } from '../types/dashboard-types'

interface RecentTransactionsProps {
  transactions: DashboardRecentTransaction[]
  /** Current dashboard month (YYYY-MM) */
  month: string
}

export function RecentTransactions({ transactions, month }: RecentTransactionsProps) {
  const viewAllHref = `/transactions?month=${month}`
  const addExpenseHref = `/transactions/new?month=${month}`

  if (transactions.length === 0) {
    return (
      <section aria-labelledby="recent-transactions-heading" className="space-y-3">
        <h2
          id="recent-transactions-heading"
          className="text-sm font-semibold text-slate-300"
        >
          Recent Transactions
        </h2>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
            <p className="text-sm text-slate-400">No expenses recorded this month.</p>
            <Link
              href={addExpenseHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Expense
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="recent-transactions-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          id="recent-transactions-heading"
          className="text-sm font-semibold text-slate-300"
        >
          Recent Transactions
        </h2>
        <Link
          href={viewAllHref}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4">
        {transactions.map((t) => (
          <TransactionItem
            key={t.id}
            id={t.id}
            description={t.description}
            categoryName={t.category?.name ?? null}
            accountName={t.account.name}
            destinationAccountName={null}
            amount={t.amount}
            type={t.type}
            essential={t.essential}
          />
        ))}
      </div>
    </section>
  )
}
