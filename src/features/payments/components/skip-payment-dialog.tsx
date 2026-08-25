'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { skipPaymentAction, skipRemainingAction } from '../server/payment-mutations'

interface SkipPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentId: string
  commitmentName: string
  plannedAmount: string
  actualAmount?: string | null
  remainingAmount?: string
  isSkipRemaining?: boolean
  monthLabel?: string
  onSuccess?: () => void
}

export function SkipPaymentDialog({
  open,
  onOpenChange,
  paymentId,
  commitmentName,
  plannedAmount,
  actualAmount = null,
  remainingAmount = '0.00',
  isSkipRemaining = false,
  monthLabel = 'this month',
  onSuccess,
}: SkipPaymentDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  const handleClose = () => {
    if (isPending) return
    setError(null)
    onOpenChange(false)
  }

  const handleConfirmSkip = () => {
    setError(null)
    startTransition(async () => {
      const res = isSkipRemaining
        ? await skipRemainingAction(paymentId)
        : await skipPaymentAction(paymentId)

      if (res.success) {
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        setError(res.message)
      }
    })
  }

  const dialogTitle = isSkipRemaining ? 'Skip Remaining Payment' : 'Skip This Month'
  const buttonLabel = isSkipRemaining ? 'Skip Remaining' : 'Skip Payment'
  const loadingLabel = isSkipRemaining ? 'Skipping Remaining...' : 'Skipping...'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="skip-payment-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 id="skip-payment-title" className="text-base font-bold text-white tracking-tight">
                {dialogTitle}
              </h2>
              <p className="text-xs text-slate-400">{commitmentName}</p>
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

        {/* Content & Warning */}
        {isSkipRemaining ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
            <p className="text-slate-300 font-medium">
              Skip remaining <span className="font-bold text-amber-400">{formatCurrency(remainingAmount)}</span> obligation for {monthLabel}?
            </p>
            <p className="text-slate-400">
              The <span className="font-semibold text-emerald-400">{formatCurrency(actualAmount ?? '0.00')}</span> already recorded as paid will be preserved.
            </p>
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
            <p className="text-slate-300 font-medium">
              Skip this payment obligation of <span className="font-bold text-white">{formatCurrency(plannedAmount)}</span> for {monthLabel}?
            </p>
            <p className="text-slate-400">
              This affects {monthLabel} only. The recurring Commitment template remains active for future months.
            </p>
          </div>
        )}

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
            onClick={handleConfirmSkip}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 active:bg-amber-700 transition-all disabled:opacity-50 min-h-[44px]"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{loadingLabel}</span>
              </>
            ) : (
              <span>{buttonLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
