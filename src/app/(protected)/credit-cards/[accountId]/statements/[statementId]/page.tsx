import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit3, Calendar, FileText, CreditCard } from 'lucide-react'
import { getCreditCardById } from '@/features/credit-cards/server/credit-card-service'
import { getStatementById } from '@/features/credit-cards/server/credit-card-statement-service'
import { getStatementBalanceState } from '@/features/credit-cards/utils/credit-card-calculations'
import { DeleteStatementDialog } from '@/features/credit-cards/components/delete-statement-dialog'
import { formatCurrency } from '@/lib/format'

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

interface StatementDetailPageProps {
  params: Promise<{ accountId: string; statementId: string }>
}

export async function generateMetadata({ params }: StatementDetailPageProps) {
  const { accountId, statementId } = await params
  const statement = await getStatementById(accountId, statementId)
  if (!statement) return { title: 'Statement Not Found — Expense Tracker' }
  const monthName = MONTH_NAMES[statement.statementMonth - 1]
  return {
    title: `${monthName} ${statement.statementYear} Statement — ${statement.account.name}`,
    description: `Statement details for ${statement.account.name}.`,
  }
}

export default async function StatementDetailPage({ params }: StatementDetailPageProps) {
  const { accountId, statementId } = await params

  const [card, statement] = await Promise.all([
    getCreditCardById(accountId),
    getStatementById(accountId, statementId),
  ])

  if (!card || !statement || statement.accountId !== card.id) {
    notFound()
  }

  const monthName = MONTH_NAMES[statement.statementMonth - 1] || `Month ${statement.statementMonth}`
  const state = getStatementBalanceState(statement.statementBalance)

  const stmtDateFormatted = new Date(statement.statementDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const dueDateFormatted = new Date(statement.dueDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href={`/credit-cards/${card.id}`}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm min-h-[44px] -ml-1 px-1"
            aria-label={`Back to ${card.name}`}
          >
            <ArrowLeft className="h-4 w-4" />
            {card.name}
          </Link>

          <Link
            href={`/credit-cards/${card.id}/statements/${statement.id}/edit`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-xl transition-all min-h-[38px]"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Statement
          </Link>
        </div>

        {/* Card & Period Title */}
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 mb-1">
            <CreditCard className="h-3.5 w-3.5" />
            {card.institutionName ? `${card.institutionName} • ` : ''}
            {card.name}
            {card.lastFourDigits ? ` (•••• ${card.lastFourDigits})` : ''}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {monthName} {statement.statementYear} Statement
          </h1>
        </div>

        {/* Statement Balance Spotlight */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">{state.label}</span>
              {state.secondaryBadge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  {state.secondaryBadge}
                </span>
              )}
            </div>
            <p className="text-3xl font-extrabold text-slate-100 tabular-nums tracking-tight">
              {formatCurrency(state.displayAmount)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                Statement Date
              </span>
              <p className="text-sm font-semibold text-slate-200">{stmtDateFormatted}</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Payment Due Date
              </span>
              <p className="text-sm font-semibold text-slate-200">{dueDateFormatted}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Minimum Payment</span>
            <span className="text-sm font-bold text-slate-200 tabular-nums">
              {statement.minimumPayment != null
                ? formatCurrency(statement.minimumPayment)
                : 'Not recorded'}
            </span>
          </div>

          {/* Notes */}
          {statement.notes && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs">
              <span className="text-slate-400 font-medium">Notes</span>
              <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 whitespace-pre-wrap">
                {statement.notes}
              </p>
            </div>
          )}
        </div>

        {/* Delete Action */}
        <div className="pt-4">
          <DeleteStatementDialog
            accountId={card.id}
            statementId={statement.id}
            cardName={card.name}
            statementMonthName={monthName}
            statementYear={statement.statementYear}
            statementBalance={statement.statementBalance}
          />
        </div>
      </div>
    </div>
  )
}
