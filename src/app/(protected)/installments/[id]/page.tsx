import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Calendar,
  CreditCard,
  Tag,
  FileText,
  CalendarDays,
  TrendingUp,
} from 'lucide-react'
import { formatCurrency, formatDay } from '@/lib/format'
import { getInstallmentById } from '@/features/installments/server/installment-service'
import { ArchiveInstallmentButton } from '@/features/installments/components/archive-installment-dialog'
import { computeInstallmentProgress } from '@/features/installments/utils/installment-progress'

export const metadata = {
  title: 'Instalment Detail — Expense Tracker',
  description: 'View instalment details and payment progress.',
}

interface InstalmentDetailPageProps {
  params: Promise<{ id: string }>
}

function formatDateDisplay(dateStr: string | null): string {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return dateStr
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default async function InstalmentDetailPage({ params }: InstalmentDetailPageProps) {
  const { id } = await params

  const installment = await getInstallmentById(id)

  // Returns 404 for: not found, archived, or foreign user — never leaks existence
  if (!installment) {
    notFound()
  }

  const {
    name,
    monthlyAmount,
    totalPayments,
    remainingPayments,
    dueDay,
    startDate,
    notes,
    category,
    account,
  } = installment

  const progress = computeInstallmentProgress(totalPayments, remainingPayments)

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/installments"
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all min-h-[44px] min-w-[44px]"
              aria-label="Back to instalments"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white tracking-tight leading-tight truncate">
                {name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">{category.name}</p>
            </div>
          </div>
          <Link
            href={`/installments/${id}/edit`}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all min-h-[44px]"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Link>
        </header>

        {/* Amount Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Monthly Instalment
          </span>
          <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
            {formatCurrency(monthlyAmount)}
          </div>
          <p className="text-xs text-slate-400 pt-1">Due on the {formatDay(dueDay)} of every month</p>
        </div>

        {/* Progress / Remaining Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
            Payment Progress
          </h2>

          {progress.hasTotal ? (
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-400">Completed</p>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {progress.completed}
                    <span className="text-slate-500 text-base font-semibold"> / {progress.total}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Remaining</p>
                  <p className="text-2xl font-extrabold text-indigo-400 tabular-nums">
                    {progress.remaining}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="w-full h-3 bg-slate-800 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(progress.percentage)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${progress.completed} of ${progress.total} payments completed`}
              >
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 text-right tabular-nums">
                {progress.percentage.toFixed(1)}% complete
              </p>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-slate-400 mb-1">Payments Remaining</p>
              <p className="text-4xl font-extrabold text-indigo-400 tabular-nums">
                {progress.remaining}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {progress.remaining === 1 ? 'payment' : 'payments'} outstanding
              </p>
            </div>
          )}
        </div>

        {/* Detailed Information Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
            Instalment Details
          </h2>

          <div className="space-y-3.5 text-sm">
            {/* Category */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-500" />
                Category
              </span>
              <span className="font-medium text-slate-200">{category.name}</span>
            </div>

            {/* Default Payment Account */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                Payment Account
              </span>
              <span className="font-medium text-slate-200 text-right max-w-[55%] leading-snug">
                {account
                  ? `${account.name}${account.institutionName ? ` (${account.institutionName})` : ''}`
                  : 'No default account'}
              </span>
            </div>

            {/* Due Day */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                Due Day
              </span>
              <span className="font-medium text-slate-200">{formatDay(dueDay)} of every month</span>
            </div>

            {/* Tracking Start Date */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                Tracking Start
              </span>
              <span className="font-medium text-slate-200">{formatDateDisplay(startDate)}</span>
            </div>

            {/* Notes */}
            {notes && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  Notes
                </span>
                <p className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                  {notes}
                </p>
              </div>
            )}

            {!notes && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  Notes
                </span>
                <span className="text-slate-600">—</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href={`/installments/${id}/edit`}
            className="flex items-center justify-center gap-2 w-full py-3 min-h-[48px] bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-sm font-semibold rounded-xl transition-all border border-slate-700"
          >
            <Edit className="h-4 w-4" />
            Edit Instalment
          </Link>

          <ArchiveInstallmentButton
            installmentId={id}
            installmentName={name}
            monthlyAmount={monthlyAmount}
            remainingPayments={remainingPayments}
          />
        </div>
      </div>
    </div>
  )
}
