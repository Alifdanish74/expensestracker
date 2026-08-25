import Link from 'next/link'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { parseMonthParam } from '@/features/payments/utils/parse-month'
import { getMonthlyPayments } from '@/features/payments/server/monthly-payment-service'
import { PaymentsMonthNav } from '@/features/payments/components/payments-month-nav'
import { PrepareMonthButton } from '@/features/payments/components/prepare-month-button'
import { MonthlyPaymentList } from '@/features/payments/components/monthly-payment-list'

export const metadata = {
  title: 'Monthly Payments — Expense Tracker',
  description: 'View and prepare planned monthly commitment payments.',
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

interface PaymentsPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const { month: monthParam = '' } = await searchParams

  const now = new Date()
  const parsed = parseMonthParam(monthParam)
  const year = parsed?.year ?? now.getFullYear()
  const month = parsed?.month ?? now.getMonth() + 1
  const resolvedMonth = `${year}-${String(month).padStart(2, '0')}`
  const monthName = MONTH_NAMES[month - 1] ?? ''
  const monthLabel = `${monthName} ${year}`

  let data: Awaited<ReturnType<typeof getMonthlyPayments>> | null = null
  let loadError: string | null = null

  try {
    data = await getMonthlyPayments(year, month)
  } catch (err) {
    console.error('Failed to load monthly payments:', err)
    loadError = 'Unable to load monthly payments.'
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all min-h-[44px] min-w-[44px]"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Monthly Payments</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Planned commitment snapshots for {monthLabel}.
              </p>
            </div>
          </div>
        </header>

        {/* Month Navigator */}
        <div className="flex justify-center">
          <PaymentsMonthNav year={year} month={month} />
        </div>

        {/* Error State */}
        {loadError && (
          <div
            role="alert"
            className="bg-slate-900 border border-rose-800/50 rounded-2xl p-6 text-center space-y-2"
          >
            <p className="text-sm font-semibold text-rose-400">{loadError}</p>
            <p className="text-xs text-slate-500">Please try refreshing the page.</p>
          </div>
        )}

        {/* Content State */}
        {data && (
          <>
            {data.isPrepared ? (
              <MonthlyPaymentList
                payments={data.payments}
                summary={data.summary}
                monthStr={resolvedMonth}
              />
            ) : (
              /* Unprepared Empty State */
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                  <CalendarDays className="h-6 w-6" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-base font-bold text-white">
                    {monthName} payments haven&apos;t been prepared yet
                  </h2>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Generate monthly payment records from your active commitments for {monthLabel}.
                  </p>
                </div>

                <div className="pt-2 max-w-xs mx-auto">
                  <PrepareMonthButton monthStr={resolvedMonth} monthLabel={monthName} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
