'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { DateInput } from '@/components/ui/date-input'
import type { Account, CreditCardStatement } from '@/generated/prisma/client'
import { creditCardStatementSchema } from '../schemas/credit-card-statement-schema'
import {
  createCreditCardStatementAction,
  updateCreditCardStatementAction,
} from '../server/credit-card-statement-actions'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

interface StatementFormProps {
  card: Account
  initialData?: CreditCardStatement | null
  mode: 'create' | 'edit'
}

function formatDateToInputString(dateStrOrObj: Date | string | null | undefined): string {
  if (!dateStrOrObj) return ''
  const d = new Date(dateStrOrObj)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

export function StatementForm({ card, initialData, mode }: StatementFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Default values
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const defaultYear = initialData?.statementYear ?? currentYear
  const defaultMonth = initialData?.statementMonth ?? currentMonth

  // Prefill default dates if not provided
  let defaultStmtDate = formatDateToInputString(initialData?.statementDate)
  let defaultDueDate = formatDateToInputString(initialData?.dueDate)

  if (!defaultStmtDate && card.statementDay) {
    const day = String(Math.min(Math.max(1, card.statementDay), 28)).padStart(2, '0')
    const month = String(defaultMonth).padStart(2, '0')
    defaultStmtDate = `${defaultYear}-${month}-${day}`
  }

  if (!defaultDueDate && card.dueDay) {
    // If due day is earlier than statement day, due date is likely next month
    let dueMonth = defaultMonth
    let dueYear = defaultYear
    if (card.statementDay && card.dueDay < card.statementDay) {
      dueMonth = defaultMonth === 12 ? 1 : defaultMonth + 1
      dueYear = defaultMonth === 12 ? defaultYear + 1 : defaultYear
    }
    const day = String(Math.min(Math.max(1, card.dueDay), 28)).padStart(2, '0')
    const month = String(dueMonth).padStart(2, '0')
    defaultDueDate = `${dueYear}-${month}-${day}`
  }

  const [statementYear, setStatementYear] = useState<number>(defaultYear)
  const [statementMonth, setStatementMonth] = useState<number>(defaultMonth)
  const [statementDate, setStatementDate] = useState<string>(defaultStmtDate)
  const [dueDate, setDueDate] = useState<string>(defaultDueDate)
  const [statementBalance, setStatementBalance] = useState<string>(
    initialData?.statementBalance != null ? String(initialData.statementBalance) : ''
  )
  const [minimumPayment, setMinimumPayment] = useState<string>(
    initialData?.minimumPayment != null ? String(initialData.minimumPayment) : ''
  )
  const [notes, setNotes] = useState<string>(initialData?.notes ?? '')

  const returnUrl = initialData
    ? `/credit-cards/${card.id}/statements/${initialData.id}`
    : `/credit-cards/${card.id}`

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload = {
      statementYear: Number(statementYear),
      statementMonth: Number(statementMonth),
      statementDate,
      dueDate,
      statementBalance,
      minimumPayment: minimumPayment.trim() || undefined,
      notes: notes.trim() || undefined,
    }

    const validated = creditCardStatementSchema.safeParse(payload)
    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? 'Invalid input data')
      return
    }

    startTransition(async () => {
      if (mode === 'create') {
        const result = await createCreditCardStatementAction(card.id, payload)
        if (!result.success) {
          setError(result.error)
          return
        }
        router.push(`/credit-cards/${card.id}/statements/${result.data?.id}`)
        router.refresh()
      } else if (initialData) {
        const result = await updateCreditCardStatementAction(card.id, initialData.id, payload)
        if (!result.success) {
          setError(result.error)
          return
        }
        router.push(`/credit-cards/${card.id}/statements/${initialData.id}`)
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top bar / Back link */}
      <div className="flex items-center justify-between">
        <Link
          href={returnUrl}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm min-h-[44px] -ml-1 px-1"
          aria-label="Cancel and go back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {mode === 'create' ? 'Record Credit Card Statement' : 'Edit Statement'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {card.institutionName ? `${card.institutionName} — ` : ''}
          {card.name}
          {card.lastFourDigits ? ` (•••• ${card.lastFourDigits})` : ''}
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-medium text-red-400"
        >
          {error}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        {/* Statement Month & Year */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="statementMonth" className="block text-xs font-medium text-slate-300">
              Statement Month <span className="text-rose-400">*</span>
            </label>
            <select
              id="statementMonth"
              value={statementMonth}
              onChange={(e) => setStatementMonth(Number(e.target.value))}
              disabled={isPending}
              className="w-full h-11 px-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="statementYear" className="block text-xs font-medium text-slate-300">
              Statement Year <span className="text-rose-400">*</span>
            </label>
            <input
              id="statementYear"
              type="number"
              min={2000}
              max={2100}
              value={statementYear}
              onChange={(e) => setStatementYear(Number(e.target.value))}
              disabled={isPending}
              className="w-full h-11 px-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Statement Date & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="statementDate" className="block text-xs font-medium text-slate-300">
              Statement Date <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <DateInput
                id="statementDate"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
                disabled={isPending}
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dueDate" className="block text-xs font-medium text-slate-300">
              Payment Due Date <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <DateInput
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isPending}
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Statement Balance */}
        <div className="space-y-1.5">
          <label htmlFor="statementBalance" className="block text-xs font-medium text-slate-300">
            Statement Balance (RM) <span className="text-rose-400">*</span>
          </label>
          <input
            id="statementBalance"
            type="number"
            step="0.01"
            placeholder="e.g. 2850.40 or -200.00"
            value={statementBalance}
            onChange={(e) => setStatementBalance(e.target.value)}
            disabled={isPending}
            className="w-full h-11 px-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors tabular-nums"
          />
          <p className="text-[11px] text-slate-500">
            Supports positive (amount owed), zero, or negative (statement credit).
          </p>
        </div>

        {/* Minimum Payment */}
        <div className="space-y-1.5">
          <label htmlFor="minimumPayment" className="block text-xs font-medium text-slate-300">
            Minimum Payment (RM) <span className="text-slate-500">(Optional)</span>
          </label>
          <input
            id="minimumPayment"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 142.52"
            value={minimumPayment}
            onChange={(e) => setMinimumPayment(e.target.value)}
            disabled={isPending}
            className="w-full h-11 px-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors tabular-nums"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label htmlFor="notes" className="block text-xs font-medium text-slate-300">
            Notes <span className="text-slate-500">(Optional)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="e.g. Annual fee included, imported manually..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            className="w-full p-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Form actions */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href={returnUrl}
          className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-semibold rounded-xl transition-all text-sm text-center border border-slate-700 min-h-[48px] flex items-center justify-center"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition-all text-sm min-h-[48px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Statement
            </>
          )}
        </button>
      </div>
    </form>
  )
}
