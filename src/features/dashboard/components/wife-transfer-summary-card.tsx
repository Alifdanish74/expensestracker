import Link from 'next/link'
import { HeartHandshake, ArrowRight, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

interface WifeTransferSummaryCardProps {
  hasItems: boolean
  readyRequired: string
  unconfirmedExpected: string
  transferred: string
  remaining: string
  excess: string
  unconfirmedCount: number
  monthKey: string
}

export function WifeTransferSummaryCard({
  hasItems,
  readyRequired,
  unconfirmedExpected,
  transferred,
  remaining,
  excess,
  unconfirmedCount,
  monthKey,
}: WifeTransferSummaryCardProps) {
  const wifeTransferHref = `/transfers/wife?month=${monthKey}`
  const excessNum = parseFloat(excess)
  const hasUnconfirmed = unconfirmedCount > 0

  return (
    <section aria-labelledby="wife-transfer-heading" className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <HeartHandshake className="h-4 w-4 text-purple-400" />
          <h2
            id="wife-transfer-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Transfer to Wife
          </h2>
        </div>
        <Link
          href={wifeTransferHref}
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1 transition-colors"
        >
          View Details
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {!hasItems ? (
          <div className="text-center py-2 space-y-2">
            <p className="text-xs text-slate-400">No transfer-to-wife items for this month.</p>
          </div>
        ) : (
          <>
            {/* Unconfirmed warning banner if unconfirmed items exist */}
            {hasUnconfirmed && (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  {unconfirmedCount} {unconfirmedCount === 1 ? 'amount needs' : 'amounts need'} confirmation
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Left col: Required / Ready requirement */}
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {hasUnconfirmed ? 'Ready Requirement' : 'Required'}
                </p>
                <p className="text-base font-bold text-slate-100 tabular-nums mt-0.5">
                  {formatCurrency(readyRequired)}
                </p>
              </div>

              {/* Right col: Transferred */}
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Transferred
                </p>
                <p className="text-base font-bold text-purple-400 tabular-nums mt-0.5">
                  {formatCurrency(transferred)}
                </p>
              </div>
            </div>

            {/* Sub-row: Remaining / Excess / Unconfirmed Expected */}
            <div className="border-t border-slate-800 pt-3.5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {hasUnconfirmed ? 'Remaining Ready' : 'Remaining'}
                </p>
                <p className="text-sm font-semibold text-amber-400 tabular-nums mt-0.5">
                  {formatCurrency(remaining)}
                </p>
              </div>

              {hasUnconfirmed ? (
                <div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Unconfirmed Expected
                  </p>
                  <p className="text-sm font-semibold text-slate-400 tabular-nums mt-0.5">
                    {formatCurrency(unconfirmedExpected)}
                  </p>
                </div>
              ) : excessNum > 0 ? (
                <div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Over Transferred
                  </p>
                  <p className="text-sm font-semibold text-emerald-400 tabular-nums mt-0.5">
                    {formatCurrency(excess)}
                  </p>
                </div>
              ) : (
                <div className="flex items-end">
                  <span className="text-xs text-slate-500">
                    {parseFloat(remaining) === 0 ? 'Fully Transferred' : 'In Progress'}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
