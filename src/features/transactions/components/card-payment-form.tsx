'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ChevronDown, CreditCard, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DateInput } from '@/components/ui/date-input'
import { cardPaymentSchema, type CardPaymentFormValues } from '../schemas/card-payment-schema'
import type { CardPaymentActionResult } from '../server/card-payment-actions'

interface AccountOption {
  id: string
  name: string
  institutionName: string | null
  type: string
  active?: boolean
}

interface CardPaymentFormProps {
  /** Non-credit-card accounts (source). */
  sourceAccounts: AccountOption[]
  /** Credit card accounts (destination). */
  creditCards: AccountOption[]
  onSubmit: (values: CardPaymentFormValues) => Promise<CardPaymentActionResult>
  mode?: 'create' | 'edit'
  initialData?: Partial<CardPaymentFormValues>
  transactionId?: string
  cancelHref?: string
}

function todayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-red-400" role="alert" aria-live="polite">{message}</p>
}

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

const inputClass = 'w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 text-sm min-h-[44px]'
const selectClass = cn(inputClass, 'appearance-none pr-9 cursor-pointer')

export function CardPaymentForm({
  sourceAccounts,
  creditCards,
  onSubmit,
  mode = 'create',
  initialData,
  transactionId,
  cancelHref,
}: CardPaymentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEditMode = mode === 'edit'
  const hasSourceAccounts = sourceAccounts.length > 0
  const hasCreditCards = creditCards.length > 0

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<CardPaymentFormValues>({
    resolver: zodResolver(cardPaymentSchema),
    defaultValues: {
      amount: initialData?.amount ?? '',
      description: initialData?.description ?? '',
      accountId: initialData?.accountId ?? sourceAccounts[0]?.id ?? '',
      destinationAccountId: initialData?.destinationAccountId ?? creditCards[0]?.id ?? '',
      transactionDate: initialData?.transactionDate ?? todayDateString(),
      notes: initialData?.notes ?? '',
    },
  })

  const sourceId = watch('accountId')
  const destId = watch('destinationAccountId')
  const isLoading = isSubmitting || isPending

  const handleFormSubmit = async (values: CardPaymentFormValues) => {
    setServerError(null)
    const result = await onSubmit(values)
    if (!result.success) { setServerError(result.error); return }
    startTransition(() => {
      if (isEditMode && transactionId) {
        router.push(`/transactions/${transactionId}`)
        router.refresh()
      } else {
        router.push('/transactions')
        router.refresh()
      }
    })
  }

  if (!hasSourceAccounts || !hasCreditCards) {
    return (
      <div className="text-center py-8 space-y-2">
        {!hasSourceAccounts && <p className="text-sm text-slate-400">You need at least one non-credit-card account as the payment source.</p>}
        {!hasCreditCards && <p className="text-sm text-slate-400">You need at least one credit card account to record a card payment.</p>}
      </div>
    )
  }

  const sourceAccount = sourceAccounts.find((a) => a.id === sourceId)
  const destCard = creditCards.find((a) => a.id === destId)

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-sm" role="alert">
          {serverError}
        </div>
      )}

      {/* Info banner */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3.5 text-xs text-indigo-300 leading-relaxed">
        <strong className="font-semibold text-indigo-200">Card payments are not counted as spending.</strong>
        {' '}This records a fund movement from your bank account to settle a credit card balance. Credit card purchases remain as individual Expense transactions.
      </div>

      {/* From/To visual */}
      {sourceId && destId && (
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-slate-200 truncate">{sourceAccount?.name ?? '—'}</span>
          <ArrowRight className="h-4 w-4 text-indigo-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <CreditCard className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
            <span className="text-sm font-medium text-indigo-300 truncate">{destCard?.name ?? '—'}</span>
          </div>
        </div>
      )}

      {/* Pay From */}
      <div>
        <Label htmlFor="cp-accountId" required>Pay From</Label>
        <div className="relative">
          <select
            id="cp-accountId" disabled={isLoading}
            className={cn(selectClass, errors.accountId && 'border-red-500/60 focus:ring-red-500')}
            {...register('accountId')}
          >
            {sourceAccounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-slate-800">{acc.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        <FieldError message={errors.accountId?.message} />
      </div>

      {/* Pay To (credit card) */}
      <div>
        <Label htmlFor="cp-destinationAccountId" required>Credit Card</Label>
        <div className="relative">
          <select
            id="cp-destinationAccountId" disabled={isLoading}
            className={cn(selectClass, errors.destinationAccountId && 'border-red-500/60 focus:ring-red-500')}
            {...register('destinationAccountId')}
          >
            {creditCards.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-slate-800">{acc.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        <FieldError message={errors.destinationAccountId?.message} />
      </div>

      {/* Amount */}
      <div>
        <Label htmlFor="cp-amount" required>Amount</Label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none select-none">RM</span>
          <input
            id="cp-amount" type="number" step="0.01" min="0.01" inputMode="decimal" placeholder="0.00"
            disabled={isLoading}
            className={cn(inputClass, 'pl-10 text-lg font-semibold tabular-nums', errors.amount && 'border-red-500/60 focus:ring-red-500')}
            {...register('amount')}
          />
        </div>
        <FieldError message={errors.amount?.message} />
      </div>

      {/* Date */}
      <div>
        <Label htmlFor="cp-transactionDate" required>Date</Label>
        <DateInput
          id="cp-transactionDate" disabled={isLoading}
          className={cn(inputClass, errors.transactionDate && 'border-red-500/60 focus:ring-red-500')}
          {...register('transactionDate')}
        />
        <FieldError message={errors.transactionDate?.message} />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="cp-description" required>Description</Label>
        <input
          id="cp-description" type="text" placeholder="e.g. Monthly card payment"
          disabled={isLoading}
          className={cn(inputClass, errors.description && 'border-red-500/60 focus:ring-red-500')}
          {...register('description')}
        />
        <FieldError message={errors.description?.message} />
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="cp-notes">Notes</Label>
        <textarea
          id="cp-notes" rows={3} placeholder="Optional notes…" disabled={isLoading}
          className={cn(inputClass, 'resize-none min-h-[88px]')}
          {...register('notes')}
        />
        <FieldError message={errors.notes?.message} />
      </div>

      {/* Actions */}
      <div className={cn('pt-2', isEditMode && 'flex gap-3')}>
        {isEditMode && cancelHref && (
          <a href={cancelHref} className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all text-sm min-h-[44px] flex items-center justify-center border border-slate-700">Cancel</a>
        )}
        <button
          type="submit" disabled={isLoading}
          className={cn(
            'py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-950/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm min-h-[44px]',
            isEditMode && cancelHref ? 'flex-1' : 'w-full'
          )}
        >
          {isLoading ? <><Loader2 className="animate-spin h-4 w-4" />Saving…</> : isEditMode ? 'Save Changes' : 'Record Card Payment'}
        </button>
      </div>
    </form>
  )
}
