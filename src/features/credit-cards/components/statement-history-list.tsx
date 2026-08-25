import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import type { CreditCardStatement } from '@/generated/prisma/client'
import { StatementCard } from './statement-card'

interface StatementHistoryListProps {
  statements: CreditCardStatement[]
  accountId: string
}

function EmptyStatementState({ accountId }: { accountId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl">
      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
        <FileText className="h-6 w-6 text-slate-500" />
      </div>
      <h4 className="text-sm font-semibold text-slate-200 mb-1">No statements recorded yet</h4>
      <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
        Record your card statement to keep a historical view of billed balances and due dates.
      </p>
      <Link
        href={`/credit-cards/${accountId}/statements/new`}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition-all text-xs min-h-[40px]"
      >
        <Plus className="h-3.5 w-3.5" />
        Record Statement
      </Link>
    </div>
  )
}

export function StatementHistoryList({ statements, accountId }: StatementHistoryListProps) {
  if (statements.length === 0) {
    return <EmptyStatementState accountId={accountId} />
  }

  return (
    <div className="space-y-3">
      {statements.map((statement, idx) => (
        <StatementCard
          key={statement.id}
          statement={statement}
          accountId={accountId}
          isLatest={idx === 0}
        />
      ))}
    </div>
  )
}
