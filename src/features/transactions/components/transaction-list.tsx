import Link from 'next/link'
import { Plus, Receipt, SearchX } from 'lucide-react'
import { TransactionItem } from './transaction-item'
import type { TransactionWithRelations } from '../server/transaction-service'

interface TransactionListProps {
  transactions: TransactionWithRelations[]
  /** True when search/account/category/type filters are active */
  isFiltered?: boolean
  /** Current month param (YYYY-MM) — used for clear filters link */
  currentMonth?: string
}

// ── Date group label helper ───────────────────────────────────────────────────

function dateGroupLabel(dateStr: string): string {
  const todayStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const yesterdayStr = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  if (dateStr === todayStr) return 'Today'
  if (dateStr === yesterdayStr) return 'Yesterday'

  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year!, month! - 1, day!)
  const thisYear = new Date().getFullYear()
  if (year === thisYear) {
    return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
  }
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TransactionList({
  transactions,
  isFiltered = false,
  currentMonth,
}: TransactionListProps) {
  if (transactions.length === 0) {
    if (isFiltered) {
      const clearHref = currentMonth
        ? `/transactions?month=${currentMonth}`
        : '/transactions'

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
            <SearchX className="h-7 w-7 text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 mb-1.5">No matching transactions</h3>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
            Try changing your search or filters.
          </p>
          <Link
            href={clearHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all text-sm min-h-[44px] border border-slate-700"
          >
            Clear Filters
          </Link>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
          <Receipt className="h-7 w-7 text-slate-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1.5">No transactions this month</h3>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
          Add your first expense to start tracking your spending.
        </p>
        <Link
          href="/transactions/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl transition-all text-sm min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </Link>
      </div>
    )
  }

  // Group transactions by transactionDate (already YYYY-MM-DD)
  const groups = new Map<string, TransactionWithRelations[]>()
  for (const t of transactions) {
    const key = t.transactionDate
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }

  // Sort date keys descending (newest first)
  const sortedDates = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => (
        <section key={dateStr}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 px-1">
            {dateGroupLabel(dateStr)}
          </h3>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4">
            {groups.get(dateStr)!.map((t) => (
              <TransactionItem
                key={t.id}
                id={t.id}
                description={t.description}
                categoryName={t.category?.name ?? null}
                accountName={t.account.name}
                destinationAccountName={t.destinationAccount?.name ?? null}
                amount={t.amount}
                type={t.type}
                essential={t.essential}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
