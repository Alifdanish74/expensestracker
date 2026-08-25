import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit, Calendar, CreditCard, Tag, Repeat, HeartHandshake, FileText, CalendarDays } from 'lucide-react'
import { formatCurrency, formatDay } from '@/lib/format'
import { getCommitmentById } from '@/features/commitments/server/commitment-service'
import { ArchiveCommitmentButton } from '@/features/commitments/components/archive-commitment-dialog'

export const metadata = {
  title: 'Commitment Detail — Expense Tracker',
  description: 'View recurring monthly commitment template details.',
}

interface CommitmentDetailPageProps {
  params: Promise<{ id: string }>
}

function formatDateDisplay(dateStr: string | null): string {
  if (!dateStr) return 'No end date'
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

export default async function CommitmentDetailPage({ params }: CommitmentDetailPageProps) {
  const { id } = await params

  const commitment = await getCommitmentById(id)

  if (!commitment) {
    notFound()
  }

  const {
    name,
    defaultAmount,
    dueDay,
    variableAmount,
    transferToWife,
    startDate,
    endDate,
    notes,
    category,
    account,
  } = commitment

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/commitments"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all min-h-[44px] min-w-[44px]"
              aria-label="Back to commitments"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{name}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{category.name}</p>
            </div>
          </div>
          <Link
            href={`/commitments/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all min-h-[44px]"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Link>
        </header>

        {/* Amount Banner Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Default Monthly Amount
          </span>
          <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
            {formatCurrency(defaultAmount)}
          </div>
          <p className="text-xs text-slate-400 pt-1">Due on the {formatDay(dueDay)} of every month</p>
        </div>

        {/* Detailed Information Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
            Commitment Details
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

            {/* Due Day */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                Due Day
              </span>
              <span className="font-medium text-slate-200">{formatDay(dueDay)} of every month</span>
            </div>

            {/* Default Payment Account */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                Default Payment Account
              </span>
              <span className="font-medium text-slate-200">
                {account
                  ? `${account.name}${account.institutionName ? ` (${account.institutionName})` : ''}`
                  : 'No default account'}
              </span>
            </div>

            {/* Variable Amount */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Repeat className="h-4 w-4 text-slate-500" />
                Variable Amount
              </span>
              <span
                className={`font-medium px-2 py-0.5 rounded text-xs ${
                  variableAmount
                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                    : 'text-slate-300'
                }`}
              >
                {variableAmount ? 'Yes (Varies monthly)' : 'No (Fixed amount)'}
              </span>
            </div>

            {/* Transfer to Wife */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-slate-500" />
                Transfer to Wife
              </span>
              <span
                className={`font-medium px-2 py-0.5 rounded text-xs ${
                  transferToWife
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    : 'text-slate-300'
                }`}
              >
                {transferToWife ? 'Yes' : 'No'}
              </span>
            </div>

            {/* Start Date */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                Start Date
              </span>
              <span className="font-medium text-slate-200">{formatDateDisplay(startDate)}</span>
            </div>

            {/* End Date */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                End Date
              </span>
              <span className="font-medium text-slate-200">{formatDateDisplay(endDate)}</span>
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
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href={`/commitments/${id}/edit`}
            className="flex items-center justify-center gap-2 w-full py-3 min-h-[48px] bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-sm font-semibold rounded-xl transition-all border border-slate-700"
          >
            <Edit className="h-4 w-4" />
            Edit Commitment
          </Link>

          <ArchiveCommitmentButton
            commitmentId={id}
            commitmentName={name}
            defaultAmount={defaultAmount}
          />
        </div>
      </div>
    </div>
  )
}
