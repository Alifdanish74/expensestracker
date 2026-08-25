'use client'

import { useState, useTransition } from 'react'
import { PlusCircle, Loader2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { addPartialPaymentAction } from '../server/payment-mutations'

interface PartialPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentId: string
  commitmentName: string
  plannedAmount: string
  currentPaidAmount: string
  remainingAmount: string
  isAddPayment?: boolean
  onSuccess?: () => void
}

export function PartialPaymentDialog({
  open,
  onOpenChange,
  paymentId,
  commitmentName,
  plannedAmount,
  currentPaidAmount,
  remainingAmount,
  isAddPayment = false,
  onSuccess,
}: PartialPaymentDialogProps) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  const handleClose = () => {
    if (isPending) return
    setError(null)
    setAmount('')
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid payment amount greater than RM 0.00')
      return
    }

    startTransition(async () => {
      const res = await addPartialPaymentAction(paymentId, amount)
      if (res.success) {
        setAmount('')
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        setError(res.message)
      }
    })
  }

  const dialogTitle = isAddPayment ? 'Add Payment' : 'Record Partial Payment'
  const buttonLabel = isAddPayment ? 'Add Payment' : 'Record Payment'
  const loadingLabel = isAddPayment ? 'Adding Payment...' : 'Recording...'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="partial-payment-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 id="partial-payment-title" className="text-base font-bold text-white tracking-tight">
              {dialogTitle}
            </h2>
            <p className="text-xs text-slate-400">{commitmentName}</p>
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

        {/* Breakdown Box */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Planned Obligation</span>
            <span className="font-semibold text-white">{formatCurrency(plannedAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Paid So Far</span>
            <span className="font-semibold text-emerald-400">{formatCurrency(currentPaidAmount)}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-medium">
            <span className="text-slate-300">Remaining Obligation</span>
            <span className="font-bold text-blue-400">{formatCurrency(remainingAmount)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="incremental-amount-input" className="block text-xs font-semibold text-slate-300">
              Payment Amount to Add (RM)
            </label>
            <input
              id="incremental-amount-input"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPending}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition-all min-h-[44px]"
            />
            <p className="text-[11px] text-slate-500">
              Enter the new incremental payment amount being added today.
            </p>
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
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 active:bg-blue-700 transition-all disabled:opacity-50 min-h-[44px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{loadingLabel}</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>{buttonLabel}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
