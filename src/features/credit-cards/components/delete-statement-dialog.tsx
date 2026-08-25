'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { deleteCreditCardStatementAction } from '../server/credit-card-statement-actions'
import { getStatementBalanceState } from '../utils/credit-card-calculations'
import { formatCurrency } from '@/lib/format'

interface DeleteStatementDialogProps {
  accountId: string
  statementId: string
  cardName: string
  statementMonthName: string
  statementYear: number
  statementBalance: unknown
}

export function DeleteStatementDialog({
  accountId,
  statementId,
  cardName,
  statementMonthName,
  statementYear,
  statementBalance,
}: DeleteStatementDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/20 rounded-xl transition-all min-h-[44px]"
        aria-label="Delete this statement"
      >
        <Trash2 className="h-4 w-4 flex-shrink-0" />
        Delete Statement
      </button>

      {open && (
        <DeleteConfirmModal
          accountId={accountId}
          statementId={statementId}
          cardName={cardName}
          statementMonthName={statementMonthName}
          statementYear={statementYear}
          statementBalance={statementBalance}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function DeleteConfirmModal({
  accountId,
  statementId,
  cardName,
  statementMonthName,
  statementYear,
  statementBalance,
  onClose,
}: DeleteStatementDialogProps & { onClose: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const state = getStatementBalanceState(statementBalance)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteCreditCardStatementAction(accountId, statementId)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.push(`/credit-cards/${accountId}`)
      router.refresh()
    })
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !isPending) {
      onClose()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-statement-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 id="delete-statement-title" className="text-base font-semibold text-slate-100">
              Delete statement?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              This removes the recorded statement snapshot from history. It does not affect transactions or the card balance.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs text-slate-400">{cardName}</p>
          <p className="text-sm font-semibold text-slate-100">
            {statementMonthName} {statementYear}
          </p>
          <p className="text-xs font-semibold text-slate-300 tabular-nums">
            {state.label}: {formatCurrency(state.displayAmount)}
          </p>
        </div>

        {error && (
          <p
            className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all text-sm min-h-[44px] border border-slate-700 disabled:opacity-50"
            autoFocus
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-xl transition-all text-sm min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
