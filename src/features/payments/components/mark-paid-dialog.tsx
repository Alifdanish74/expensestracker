'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { getTodayDateString } from '../utils/payment-status-utils'
import { markPaidAction } from '../server/payment-mutations'
import { DateInput } from '@/components/ui/date-input'

interface MarkPaidDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentId: string
  commitmentName: string
  plannedAmount: string
  onSuccess?: () => void
}

export function MarkPaidDialog({
  open,
  onOpenChange,
  paymentId,
  commitmentName,
  plannedAmount,
  onSuccess,
}: MarkPaidDialogProps) {
  const [actualAmount, setActualAmount] = useState(plannedAmount)
  const [paidDate, setPaidDate] = useState(() => getTodayDateString())
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

    const num = parseFloat(actualAmount)
    if (isNaN(num) || num < 0) {
      setError('Please enter a valid non-negative payment amount')
      return
    }

    if (!paidDate) {
      setError('Please select a payment date')
      return
    }

    startTransition(async () => {
      const res = await markPaidAction(paymentId, actualAmount, paidDate)
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
        aria-labelledby="mark-paid-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 id="mark-paid-title" className="text-base font-bold text-white tracking-tight">
              Mark Payment as Paid
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

        {/* Planned Reference */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="text-slate-400">Planned Obligation</span>
          <span className="font-semibold text-white">{formatCurrency(plannedAmount)}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="actual-amount-input" className="block text-xs font-semibold text-slate-300">
              Actual Amount Paid (RM)
            </label>
            <input
              id="actual-amount-input"
              type="number"
              step="0.01"
              min="0"
              required
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPending}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 transition-all min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="paid-date-input" className="block text-xs font-semibold text-slate-300">
              Paid Date
            </label>
            <DateInput
              id="paid-date-input"
              required
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              disabled={isPending}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 transition-all min-h-[44px]"
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
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 active:bg-emerald-600 transition-all disabled:opacity-50 min-h-[44px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Marking Paid...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
