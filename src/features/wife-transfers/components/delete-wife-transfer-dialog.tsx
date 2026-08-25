'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { deleteWifeTransferAction } from '../server/wife-transfer-actions'

interface DeleteWifeTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transferId: string
  amount: string
  transferDate: string
  onSuccess?: () => void
}

export function DeleteWifeTransferDialog({
  open,
  onOpenChange,
  transferId,
  amount,
  transferDate,
  onSuccess,
}: DeleteWifeTransferDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  const handleClose = () => {
    if (isPending) return
    setError(null)
    onOpenChange(false)
  }

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const res = await deleteWifeTransferAction(transferId)
      if (res.success) {
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        setError(res.message)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-transfer-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 id="delete-transfer-title" className="text-base font-bold text-white tracking-tight">
                Delete Transfer Record?
              </h2>
              <p className="text-xs text-slate-400">This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Transfer Entry Info */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-medium">
            <span className="text-slate-400">Transfer Amount</span>
            <span className="text-sm font-bold text-white">{formatCurrency(amount)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Transfer Date</span>
            <span className="text-slate-300">{transferDate}</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
            This will remove this transfer entry from the month&apos;s transfer history and summary calculations.
          </p>
        </div>

        {error && (
          <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
            {error}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 active:bg-slate-600 transition-all min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 active:bg-rose-700 transition-all disabled:opacity-50 min-h-[44px]"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete Record</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
