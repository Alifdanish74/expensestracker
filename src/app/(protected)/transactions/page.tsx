import Link from 'next/link'
import { ArrowLeft, Plus, TrendingUp, ArrowLeftRight, CreditCard, RotateCcw } from 'lucide-react'
import { getTransactions, getFilterOptions } from '@/features/transactions/server/transaction-service'
import { TransactionList } from '@/features/transactions/components/transaction-list'
import { MonthNav } from '@/features/transactions/components/month-nav'
import { SearchFilterBar } from '@/features/transactions/components/search-filter-bar'
import { formatCurrency } from '@/lib/format'
import { LogoutButton } from '@/components/auth/logout-button'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Transactions — Expense Tracker',
  description: 'View and manage your monthly transaction history.',
}

interface TransactionsPageProps {
  searchParams: Promise<{
    month?: string
    q?: string
    account?: string
    category?: string
    type?: string
  }>
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = await searchParams

  const now = new Date()
  const currentMonthDefault = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthParam = params.month ?? currentMonthDefault

  const search = params.q ?? ''
  const accountId = params.account ?? ''
  const categoryId = params.category ?? ''
  const typeFilter = params.type ?? ''

  const [result, { accounts, categories }] = await Promise.all([
    getTransactions({ month: monthParam, search, accountId, categoryId, type: typeFilter }),
    getFilterOptions(),
  ])

  const {
    transactions,
    grossExpenses,
    refundTotal,
    netRecordedSpending,
    incomeReceived,
    transferTotal,
    cardPaymentTotal,
    isFiltered,
    resolvedMonth,
  } = result

  const [yearStr, monthStr] = resolvedMonth.split('-')
  const safeYear = parseInt(yearStr!, 10)
  const safeMonth = parseInt(monthStr!, 10)

  const extraParams: Record<string, string> = {}
  if (search) extraParams.q = search
  if (accountId) extraParams.account = accountId
  if (categoryId) extraParams.category = categoryId
  if (typeFilter) extraParams.type = typeFilter

  const addExpenseHref = `/transactions/new?month=${resolvedMonth}`
  const hasRefunds = parseFloat(refundTotal) > 0
  const hasIncome = parseFloat(incomeReceived) > 0
  const hasTransfers = parseFloat(transferTotal) > 0
  const hasCardPayments = parseFloat(cardPaymentTotal) > 0
  const showSecondaryRow = hasIncome || hasTransfers || hasCardPayments

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-28">
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
        <div className="flex items-start justify-between gap-4 mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Transactions</h1>
          <Link
            href={addExpenseHref}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl transition-all text-sm min-h-[44px] shadow-lg shadow-emerald-950/40"
            aria-label="Add expense"
          >
            <Plus className="h-4 w-4" />
            Add
          </Link>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-center mb-5">
          <MonthNav year={safeYear} month={safeMonth} extraParams={extraParams} />
        </div>

        {/* Search + filter bar */}
        <div className="mb-5">
          <SearchFilterBar
            key={`${search}-${typeFilter}`}
            currentMonth={resolvedMonth}
            currentSearch={search}
            currentAccountId={accountId}
            currentCategoryId={categoryId}
            currentType={typeFilter}
            accounts={accounts}
            categories={categories}
          />
        </div>

        {/* Multi-type summary card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 space-y-3">
          {/* Spending section */}
          <div className="space-y-2">
            {hasRefunds && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Gross Expenses</p>
                <p className="text-sm font-semibold text-rose-400/80 tabular-nums">{formatCurrency(grossExpenses)}</p>
              </div>
            )}
            {hasRefunds && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Refunds</p>
                <p className="text-sm font-semibold text-teal-400 tabular-nums">−{formatCurrency(refundTotal)}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className={cn(
                'text-xs font-semibold uppercase tracking-wider',
                hasRefunds ? 'text-slate-300' : 'text-slate-500'
              )}>
                {isFiltered ? 'Filtered Net Spending' : hasRefunds ? 'Net Recorded Spending' : 'Total Expenses This Month'}
              </p>
              <p className="text-xl font-bold text-rose-400 tabular-nums">{formatCurrency(netRecordedSpending)}</p>
            </div>
          </div>

          {/* Secondary metrics */}
          {showSecondaryRow && (
            <>
              <div className="border-t border-slate-800 pt-3 space-y-2">
                {hasIncome && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <p className="text-xs text-slate-500">Income Received</p>
                    </div>
                    <p className="text-sm font-medium text-emerald-400 tabular-nums">+{formatCurrency(incomeReceived)}</p>
                  </div>
                )}
                {hasTransfers && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ArrowLeftRight className="h-3 w-3 text-blue-500" />
                      <p className="text-xs text-slate-500">Transfers</p>
                    </div>
                    <p className="text-sm font-medium text-blue-400 tabular-nums">{formatCurrency(transferTotal)}</p>
                  </div>
                )}
                {hasCardPayments && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3 w-3 text-indigo-500" />
                      <p className="text-xs text-slate-500">Card Payments</p>
                    </div>
                    <p className="text-sm font-medium text-indigo-400 tabular-nums">{formatCurrency(cardPaymentTotal)}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <p className="text-xs text-slate-600 text-right pt-1 border-t border-slate-800/50">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Other transaction types — quick access */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5 px-1">Other Transactions</p>
          <div className="grid grid-cols-3 gap-2">
            <Link
              href={`/transactions/new/income?month=${resolvedMonth}`}
              className="flex flex-col items-center gap-1.5 py-3 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all text-center"
            >
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">Income</span>
            </Link>
            <Link
              href={`/transactions/new/transfer?month=${resolvedMonth}`}
              className="flex flex-col items-center gap-1.5 py-3 px-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all text-center"
            >
              <ArrowLeftRight className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-300">Transfer</span>
            </Link>
            <Link
              href={`/transactions/new/card-payment?month=${resolvedMonth}`}
              className="flex flex-col items-center gap-1.5 py-3 px-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl transition-all text-center"
            >
              <CreditCard className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-300">Pay Card</span>
            </Link>
          </div>
          <div className="mt-2">
            <Link
              href={`/transactions/new/refund?month=${resolvedMonth}`}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-xl transition-all w-full"
            >
              <RotateCcw className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-medium text-teal-300">Record Refund</span>
            </Link>
          </div>
        </div>

        {/* Transaction list grouped by date */}
        <TransactionList
          transactions={transactions}
          isFiltered={isFiltered}
          currentMonth={resolvedMonth}
        />
      </div>
    </div>
  )
}
