import Link from 'next/link'
import { Plus, Settings, CalendarDays, Banknote, HeartHandshake, Layers, CreditCard, TrendingUp, ArrowLeftRight } from 'lucide-react'
import { getDashboardSummary } from '@/features/dashboard/server/dashboard-service'
import { DashboardMonthNav } from '@/features/dashboard/components/dashboard-month-nav'
import { DashboardIncomeCard } from '@/features/dashboard/components/dashboard-income-card'
import { ActualSpendingCard } from '@/features/dashboard/components/actual-spending-card'
import { SpendingByCategory } from '@/features/dashboard/components/spending-by-category'
import { MonthlyObligationsCard } from '@/features/dashboard/components/monthly-obligations-card'
import { PaymentsToHandleCard } from '@/features/dashboard/components/payments-to-handle-card'
import { WifeTransferSummaryCard } from '@/features/dashboard/components/wife-transfer-summary-card'
import { InstallmentProgressCard } from '@/features/dashboard/components/installment-progress-card'
import { RecentTransactions } from '@/features/dashboard/components/recent-transactions'

export const metadata = {
  title: 'Dashboard — Expense Tracker',
  description: 'Actual vs Planned financial overview and monthly summary.',
}

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { month: monthParam = '' } = await searchParams

  let summary: Awaited<ReturnType<typeof getDashboardSummary>> | null = null
  let loadError: string | null = null

  try {
    summary = await getDashboardSummary(monthParam)
  } catch (error) {
    console.error('Failed to load dashboard summary:', error)
    loadError = 'Unable to load dashboard summary. Please refresh.'
  }

  const navYear = summary?.month.year ?? new Date().getFullYear()
  const navMonth = summary?.month.month ?? new Date().getMonth() + 1
  const monthKey = summary?.month.key ?? `${navYear}-${String(navMonth).padStart(2, '0')}`

  const addExpenseHref = `/transactions/new?month=${monthKey}`
  const paymentsHref = `/payments?month=${monthKey}`
  const wifeTransferHref = `/transfers/wife?month=${monthKey}`

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">

        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">Actual vs Planned Overview</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Link
              href="/credit-cards"
              aria-label="Credit Cards"
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 active:bg-indigo-500/30 text-indigo-300 transition-all min-h-[36px]"
            >
              <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
              Cards
            </Link>
            <Link
              href={wifeTransferHref}
              aria-label="Transfer to wife"
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 active:bg-purple-500/30 text-purple-300 transition-all min-h-[36px]"
            >
              <HeartHandshake className="h-3.5 w-3.5 text-purple-400" />
              Wife
            </Link>
            <Link
              href={paymentsHref}
              aria-label="Monthly payments"
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-slate-100 transition-all min-h-[36px]"
            >
              <Banknote className="h-3.5 w-3.5 text-blue-400" />
              Payments
            </Link>
            <Link
              href="/installments"
              aria-label="Instalments"
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-slate-100 transition-all min-h-[36px]"
            >
              <Layers className="h-3.5 w-3.5 text-purple-400" />
              Instalments
            </Link>
            <Link
              href="/commitments"
              aria-label="Monthly commitments"
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-slate-100 transition-all min-h-[36px]"
            >
              <CalendarDays className="h-3.5 w-3.5 text-emerald-400" />
              Commitments
            </Link>
            <Link
              href="/settings/financial"
              aria-label="Financial settings"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-400 hover:text-slate-200 transition-all min-h-[36px] min-w-[36px]"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* ── Month Navigator ── */}
        <DashboardMonthNav year={navYear} month={navMonth} />

        {/* ── Error State ── */}
        {loadError && (
          <div
            role="alert"
            className="bg-slate-900 border border-rose-800/50 rounded-2xl p-6 text-center space-y-2"
          >
            <p className="text-sm font-semibold text-rose-400">{loadError}</p>
            <p className="text-xs text-slate-500">Please try refreshing the page.</p>
          </div>
        )}

        {/* ── Dashboard V2 Content ── */}
        {summary && (
          <>
            {/* A. Monthly Net Income */}
            <DashboardIncomeCard
              configured={summary.income.configured}
              monthlyNetIncome={summary.income.monthlyNetIncome}
            />

            {/* B. Actual Spending Domain */}
            <ActualSpendingCard
              grossExpenses={summary.actual.grossExpenses}
              refunds={summary.actual.refunds}
              netRecordedSpending={summary.actual.netRecordedSpending}
              paidObligations={summary.actual.paidObligations}
              totalPaidOutflow={summary.actual.totalPaidOutflow}
              remainingAfterRecordedExpenses={summary.actual.remainingAfterRecordedExpenses}
              netRemainingAfterPaidOutflows={summary.actual.netRemainingAfterPaidOutflows}
              incomeConfigured={summary.income.configured}
            />

            {/* Add Expense Quick Action Button */}
            <Link
              id="dashboard-add-expense"
              href={addExpenseHref}
              className="flex items-center justify-center gap-2 w-full py-3 min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/30"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Expense
            </Link>

            {/* Secondary quick-action strip */}
            <div className="grid grid-cols-3 gap-2">
              <Link
                href={`/transactions/new/income?month=${monthKey}`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-300 transition-all min-h-[40px]"
                aria-label="Record income"
              >
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                Income
              </Link>
              <Link
                href={`/transactions/new/transfer?month=${monthKey}`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-xs font-semibold text-blue-300 transition-all min-h-[40px]"
                aria-label="Transfer money"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                Transfer
              </Link>
              <Link
                href={`/transactions/new/card-payment?month=${monthKey}`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-xs font-semibold text-indigo-300 transition-all min-h-[40px]"
                aria-label="Pay credit card"
              >
                <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                Pay Card
              </Link>
            </div>

            {/* Spending by Category (Actual EXPENSE txns) */}
            <SpendingByCategory
              breakdown={summary.actual.categorySpending}
              totalExpenses={summary.actual.netRecordedSpending}
            />

            {/* C. Monthly Obligation Domain */}
            <MonthlyObligationsCard
              planned={summary.obligations.planned}
              paid={summary.obligations.paid}
              remaining={summary.obligations.remaining}
              needsAttentionCount={summary.obligations.needsAttentionCount}
              isPrepared={summary.obligations.isPrepared}
              monthKey={monthKey}
            />

            {/* D. Payments to Handle Section */}
            <PaymentsToHandleCard
              payments={summary.paymentsToHandle}
              monthKey={monthKey}
            />

            {/* E. Transfer to Wife Domain */}
            <WifeTransferSummaryCard
              hasItems={summary.wifeTransfer.hasItems}
              readyRequired={summary.wifeTransfer.readyRequired}
              unconfirmedExpected={summary.wifeTransfer.unconfirmedExpected}
              transferred={summary.wifeTransfer.transferred}
              remaining={summary.wifeTransfer.remaining}
              excess={summary.wifeTransfer.excess}
              unconfirmedCount={summary.wifeTransfer.unconfirmedCount}
              monthKey={monthKey}
            />

            {/* F. Instalment Progress Domain */}
            <InstallmentProgressCard
              activeCount={summary.installments.activeCount}
              nearCompletionCount={summary.installments.nearCompletionCount}
              completedCount={summary.installments.completedCount}
              preview={summary.installments.preview}
            />

            {/* G. Recent Transactions */}
            <RecentTransactions
              transactions={summary.actual.recentTransactions}
              month={summary.month.key}
            />
          </>
        )}
      </div>
    </div>
  )
}
