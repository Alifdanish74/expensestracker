import { Plus, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { WifeTransferSummary } from '../types/wife-transfer-types'

interface WifeTransferSummaryProps {
  summary: WifeTransferSummary
  onRecordClick: () => void
}

export function WifeTransferSummaryCard({
  summary,
  onRecordClick,
}: WifeTransferSummaryProps) {
  const hasUnconfirmed = summary.unconfirmedCount > 0
  const isOverTransferred = parseFloat(summary.excessTotal) > 0

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Top Section: Primary Requirement Metric & Record Action */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {hasUnconfirmed ? 'Ready Requirement' : 'Required Funding'}
          </p>
          <p className="text-2xl font-bold text-white tracking-tight mt-1">
            {formatCurrency(summary.readyRequiredTotal)}
          </p>
        </div>

        <button
          type="button"
          onClick={onRecordClick}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-bold transition-all shadow-md min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Record Transfer</span>
        </button>
      </div>

      {/* Grid: Transferred vs Remaining / Excess */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 space-y-0.5">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Transferred
          </p>
          <p className="text-base font-bold text-white tracking-tight">
            {formatCurrency(summary.transferredTotal)}
          </p>
        </div>

        {isOverTransferred ? (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 space-y-0.5">
            <p className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider">
              Over Transferred
            </p>
            <p className="text-base font-bold text-purple-300 tracking-tight">
              {formatCurrency(summary.excessTotal)}
            </p>
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 space-y-0.5">
            <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
              {hasUnconfirmed ? 'Remaining Ready' : 'Remaining'}
            </p>
            <p className="text-base font-bold text-white tracking-tight">
              {formatCurrency(summary.remainingTotal)}
            </p>
          </div>
        )}
      </div>

      {/* Warning Box for Unconfirmed Items */}
      {hasUnconfirmed && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-amber-300">
            <p className="font-bold">
              {summary.unconfirmedCount} amount{summary.unconfirmedCount > 1 ? 's' : ''} still need{summary.unconfirmedCount === 1 ? 's' : ''} confirmation
            </p>
            <p className="text-amber-400/90 text-[11px]">
              Unconfirmed expected:{' '}
              <span className="font-semibold">{formatCurrency(summary.unconfirmedExpectedTotal)}</span>. Final requirement may increase after confirmation.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
