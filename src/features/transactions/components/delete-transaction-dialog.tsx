'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { deleteTransactionAction } from '../server/delete-transaction-actions'
import { formatCurrency } from '@/lib/format'
import { getTransactionTypeLabel } from '../utils/transaction-type-utils'

interface DeleteTransactionDialogProps {
  transactionId: string
  description: string
  amount: string
  type: string
  /** URL to redirect to after successful delete */
  returnTo: string
}

/**
 * Delete button + confirmation dialog for any transaction type.
 * Displays a type-aware label and calls the generalised deleteTransactionAction.
 * EXPENSE deletion is blocked server-side if linked refunds exist.
 */
export function DeleteTransactionDialog({
  transactionId,
  description,
  amount,
  type,
  returnTo,
}: DeleteTransactionDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/20 rounded-xl transition-all min-h-[44px]"
        aria-label={`Delete this ${getTransactionTypeLabel(type).toLowerCase()}`}
      >
        <Trash2 className="h-4 w-4 flex-shrink-0" />
        Delete {getTransactionTypeLabel(type)}
      </button>

      {open && (
        <DeleteConfirmDialog
          transactionId={transactionId}
          description={description}
          amount={amount}
          type={type}
          returnTo={returnTo}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function DeleteConfirmDialog({
  transactionId,
  description,
  amount,
  type,
  returnTo,
  onClose,
}: DeleteTransactionDialogProps & { onClose: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteTransactionAction(transactionId)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.push(returnTo)
      router.refresh()
    })
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !isPending) {
      onClose()
    }
  }

  const typeLabel = getTransactionTypeLabel(type)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog panel */}
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
        {/* Icon + title */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 id="delete-dialog-title" className="text-base font-semibold text-slate-100">
              Delete {typeLabel.toLowerCase()}?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        {/* Transaction summary */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 space-y-0.5">
          <p className="text-sm font-medium text-slate-100 truncate">{description}</p>
          <p className="text-sm font-semibold text-rose-400 tabular-nums">
            {formatCurrency(amount)}
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2" role="alert">
            {error}
          </p>
        )}

        {/* Actions */}
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
              <><Loader2 className="animate-spin h-4 w-4" />Deleting…</>
            ) : (
              <><Trash2 className="h-4 w-4" />Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
