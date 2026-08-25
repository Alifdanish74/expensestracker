import Link from 'next/link'
import { Calendar, ChevronRight, FileText } from 'lucide-react'
import type { CreditCardStatement } from '@/generated/prisma/client'
import { getStatementBalanceState } from '../utils/credit-card-calculations'
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

interface StatementCardProps {
  statement: CreditCardStatement
  accountId: string
  isLatest?: boolean
}

export function StatementCard({ statement, accountId, isLatest }: StatementCardProps) {
  const monthName = MONTH_NAMES[statement.statementMonth - 1] || `Month ${statement.statementMonth}`
  const state = getStatementBalanceState(statement.statementBalance)

  // Format dates cleanly (e.g. 18 Aug 2026)
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
    <Link
      href={`/credit-cards/${accountId}/statements/${statement.id}`}
      className="block bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-sm group touch-manipulation"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">
              {monthName} {statement.statementYear}
            </span>
            {isLatest && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                Latest
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-slate-500" />
              {stmtDateFormatted}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-500" />
              Due {dueDateFormatted}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">
              {state.label}
            </span>
            <span className="text-sm font-bold text-slate-100 tabular-nums">
              {formatCurrency(state.displayAmount)}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>
      </div>

      {statement.minimumPayment != null && (
        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Minimum Payment</span>
          <span className="font-semibold text-slate-300 tabular-nums">
            {formatCurrency(statement.minimumPayment)}
          </span>
        </div>
      )}
    </Link>
  )
}
