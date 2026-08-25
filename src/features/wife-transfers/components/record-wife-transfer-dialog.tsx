'use client'

import { useState, useTransition } from 'react'
import { PlusCircle, Loader2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { getTodayDateString } from '@/features/payments/utils/payment-status-utils'
import { recordWifeTransferAction } from '../server/wife-transfer-actions'
import { DateInput } from '@/components/ui/date-input'

interface AccountOption {
  id: string
  name: string
  institutionName: string | null
}

interface RecordWifeTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentYear: number
  paymentMonth: number
  remainingAmount: string
  accounts: AccountOption[]
  monthLabel: string
  onSuccess?: () => void
}

export function RecordWifeTransferDialog({
  open,
  onOpenChange,
  paymentYear,
  paymentMonth,
  remainingAmount,
  accounts,
  monthLabel,
  onSuccess,
}: RecordWifeTransferDialogProps) {
  const defaultAmount = parseFloat(remainingAmount) > 0 ? remainingAmount : ''
  const [amount, setAmount] = useState(defaultAmount)
  const [transferDate, setTransferDate] = useState(() => getTodayDateString())
  const [sourceAccountId, setSourceAccountId] = useState<string>('')
  const [notes, setNotes] = useState('')
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
      setError('Please enter a valid transfer amount greater than RM 0.00')
      return
    }

    if (!transferDate) {
      setError('Please select a valid transfer date')
      return
    }

    startTransition(async () => {
      const res = await recordWifeTransferAction({
        paymentYear,
        paymentMonth,
        amount,
        transferDate,
        sourceAccountId: sourceAccountId !== '' ? sourceAccountId : null,
        notes: notes.trim() !== '' ? notes.trim() : null,
      })

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
        aria-labelledby="record-transfer-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 id="record-transfer-title" className="text-base font-bold text-white tracking-tight">
              Record Transfer to Wife
            </h2>
            <p className="text-xs text-slate-400">Assigned for {monthLabel} obligations</p>
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

        {/* Remaining Reference */}
        {parseFloat(remainingAmount) > 0 && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Remaining Ready Amount</span>
            <span className="font-semibold text-blue-400">{formatCurrency(remainingAmount)}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="transfer-amount-input" className="block text-xs font-semibold text-slate-300">
              Transfer Amount (RM)
            </label>
            <input
              id="transfer-amount-input"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPending}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 transition-all min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="transfer-date-input" className="block text-xs font-semibold text-slate-300">
              Transfer Date
            </label>
            <DateInput
              id="transfer-date-input"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              disabled={isPending}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 transition-all min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="source-account-select" className="block text-xs font-semibold text-slate-300">
              From Account (Optional)
            </label>
            <select
              id="source-account-select"
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              disabled={isPending}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 transition-all min-h-[44px]"
            >
              <option value="">No source account selected</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} {acc.institutionName ? `(${acc.institutionName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="transfer-notes-input" className="block text-xs font-semibold text-slate-300">
              Notes (Optional)
            </label>
            <input
              id="transfer-notes-input"
              type="text"
              maxLength={200}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sent via DuitNow"
              disabled={isPending}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 transition-all min-h-[44px]"
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
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 active:bg-purple-700 transition-all disabled:opacity-50 min-h-[44px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>Record Transfer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
