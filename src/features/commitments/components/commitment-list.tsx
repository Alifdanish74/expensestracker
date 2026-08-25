import Link from 'next/link'
import { Plus, CalendarDays, Info } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { CommitmentCard } from './commitment-card'
import type { CommitmentWithRelations } from '../server/commitment-service'

interface CommitmentListProps {
  commitments: CommitmentWithRelations[]
  totalDefaultAmount: string
}

export function CommitmentList({ commitments, totalDefaultAmount }: CommitmentListProps) {
  const hasCommitments = commitments.length > 0

  return (
    <div className="space-y-6">
      {/* ── Total Default Commitments Summary Card ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <CalendarDays className="h-4 w-4 text-emerald-400" />
            Total Default Commitments
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
            <Info className="h-3 w-3 text-slate-400" />
            Planned defaults
          </span>
        </div>

        <div>
          <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
            {formatCurrency(totalDefaultAmount)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Planned monthly recurring obligations total. Does not alter actual expense totals.
          </p>
        </div>
      </div>

      {/* ── Primary Action Button ── */}
      <div>
        <Link
          id="add-commitment-button"
          href="/commitments/new"
          className="flex items-center justify-center gap-2 w-full py-3 min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-950/40"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Commitment
        </Link>
      </div>

      {/* ── Commitments List / Empty State ── */}
      {!hasCommitments ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <CalendarDays className="h-6 w-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-200">No monthly commitments yet.</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Add recurring items such as housing, utilities, groceries, or loans.
            </p>
          </div>
          <Link
            href="/commitments/new"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all min-h-[44px]"
          >
            Add Commitment
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Active Commitments ({commitments.length})
          </h2>
          <div className="space-y-3">
            {commitments.map((commitment) => (
              <CommitmentCard key={commitment.id} commitment={commitment} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
