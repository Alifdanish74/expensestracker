import { useState } from 'react'
import { ArrowUpRight, Calendar, CreditCard, FileText, Trash2, History } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { WifeTransferRecord } from '../types/wife-transfer-types'
import { DeleteWifeTransferDialog } from './delete-wife-transfer-dialog'

interface WifeTransferHistoryProps {
  transfers: WifeTransferRecord[]
  monthLabel: string
}

const FULL_MONTHS = [
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

function formatTransferDate(dateStr: string): string {
  const parts = dateStr.slice(0, 10).split('-').map(Number)
  const y = parts[0]
  const m = parts[1]
  const d = parts[2]
  if (!y || !m || !d) return dateStr
  const monthName = FULL_MONTHS[m - 1]?.slice(0, 3) ?? ''
  return `${d} ${monthName} ${y}`
}

export function WifeTransferHistory({ transfers, monthLabel }: WifeTransferHistoryProps) {
  const [selectedDeleteTransfer, setSelectedDeleteTransfer] = useState<WifeTransferRecord | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <History className="h-4 w-4 text-purple-400" />
          <span>Transfer History ({transfers.length})</span>
        </h3>
      </div>

      {transfers.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center space-y-2 text-xs">
          <p className="font-semibold text-slate-300">No transfers recorded for {monthLabel} yet.</p>
          <p className="text-slate-500">Record a funding transfer to wife above.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {transfers.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 transition-all hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white tracking-tight">
                      {formatCurrency(t.amount)}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <Calendar className="h-3 w-3 text-slate-500 shrink-0" />
                      <span>{formatTransferDate(t.transferDate)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDeleteTransfer(t)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors min-h-[32px] min-w-[32px]"
                  aria-label="Delete transfer record"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Source Account & Notes */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[11px]">
                  <CreditCard className="h-3 w-3 text-slate-400" />
                  {t.sourceAccountName ?? 'No source account'}
                </span>

                {t.notes && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-400 text-[11px] truncate max-w-[200px]">
                    <FileText className="h-3 w-3 text-slate-500" />
                    {t.notes}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {selectedDeleteTransfer && (
        <DeleteWifeTransferDialog
          open={!!selectedDeleteTransfer}
          onOpenChange={(open: boolean) => !open && setSelectedDeleteTransfer(null)}
          transferId={selectedDeleteTransfer.id}
          amount={selectedDeleteTransfer.amount}
          transferDate={formatTransferDate(selectedDeleteTransfer.transferDate)}
        />
      )}
    </div>
  )
}
