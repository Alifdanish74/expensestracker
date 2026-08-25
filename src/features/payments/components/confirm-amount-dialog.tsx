'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { confirmPaymentAmountAction } from '../server/payment-mutations'

interface ConfirmAmountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentId: string
  commitmentName: string
  defaultAmount: string
  monthLabel: string
  onSuccess?: () => void
}

export function ConfirmAmountDialog({
  open,
  onOpenChange,
  paymentId,
  commitmentName,
  defaultAmount,
  monthLabel,
  onSuccess,
}: ConfirmAmountDialogProps) {
  const [amount, setAmount] = useState(defaultAmount)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  const handleClose = () => {
    if (isPending) return
    setError(null)
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than RM 0.00')
      return
    }

    startTransition(async () => {
      const res = await confirmPaymentAmountAction(paymentId, amount)
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
        aria-labelledby="confirm-amount-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 id="confirm-amount-title" className="text-base font-bold text-white tracking-tight">
              Confirm Monthly Amount
            </h2>
            <p className="text-xs text-slate-400">
              {commitmentName} for {monthLabel}
            </p>
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

        {/* Expected Amount Info */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="text-slate-400">Default / Expected Amount</span>
          <span className="font-semibold text-amber-400">{formatCurrency(defaultAmount)}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="confirmed-amount-input" className="block text-xs font-semibold text-slate-300">
              Amount for {monthLabel} (RM)
            </label>
            <input
              id="confirmed-amount-input"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPending}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition-all min-h-[44px]"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              {error}
            </div>
          )}

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
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 active:bg-amber-600 transition-all disabled:opacity-50 min-h-[44px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Confirming...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Amount</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
