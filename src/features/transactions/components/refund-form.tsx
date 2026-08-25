'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ChevronDown, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DateInput } from '@/components/ui/date-input'
import { formatCurrency } from '@/lib/format'
import { refundSchema, type RefundFormValues } from '../schemas/refund-schema'
import type { RefundActionResult } from '../server/refund-actions'

interface ExpenseOption {
  id: string
  description: string
  amount: string
  transactionDate: string
  category: { id: string; name: string } | null
  remainingRefundable: string
  refundedAmount: string
  fullyRefunded: boolean
}

interface AccountOption {
  id: string
  name: string
  institutionName: string | null
  type: string
  active?: boolean
}

interface RefundFormProps {
  expenses: ExpenseOption[]
  accounts: AccountOption[]
  onSubmit: (values: RefundFormValues) => Promise<RefundActionResult>
  mode?: 'create' | 'edit'
  initialData?: Partial<RefundFormValues>
  transactionId?: string
  cancelHref?: string
  /** Pre-selected expense ID (from ?expenseId= query param) */
  preselectedExpenseId?: string
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

const inputClass = 'w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50 text-sm min-h-[44px]'
const selectClass = cn(inputClass, 'appearance-none pr-9 cursor-pointer')

export function RefundForm({
  expenses,
  accounts,
  onSubmit,
  mode = 'create',
  initialData,
  transactionId,
  cancelHref,
  preselectedExpenseId,
}: RefundFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEditMode = mode === 'edit'
  const hasAccounts = accounts.length > 0
  const hasExpenses = expenses.length > 0

  const defaultExpenseId =
    preselectedExpenseId ??
    initialData?.relatedTransactionId ??
    expenses.find((e) => !e.fullyRefunded)?.id ??
    expenses[0]?.id ??
    ''

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      relatedTransactionId: defaultExpenseId,
      amount: initialData?.amount ?? '',
      description: initialData?.description ?? '',
      accountId: initialData?.accountId ?? accounts[0]?.id ?? '',
      transactionDate: initialData?.transactionDate ?? todayDateString(),
      notes: initialData?.notes ?? '',
    },
  })

  const selectedExpenseId = watch('relatedTransactionId')
  const selectedExpense = expenses.find((e) => e.id === selectedExpenseId)
  const isLoading = isSubmitting || isPending

  // Auto-fill description when expense changes (create mode only)
  useEffect(() => {
    if (isEditMode) return
    if (selectedExpense) {
      setValue('description', `Refund: ${selectedExpense.description}`, { shouldDirty: false })
    }
  }, [selectedExpenseId, isEditMode, selectedExpense, setValue])

  const handleFormSubmit = async (values: RefundFormValues) => {
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

  if (!hasExpenses) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-400">No expense transactions found to refund. Record an Expense first.</p>
      </div>
    )
  }
  if (!hasAccounts) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-400">You need at least one active account to receive a refund.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-sm" role="alert">
          {serverError}
        </div>
      )}

      {/* Original Expense selector */}
      <div>
        <Label htmlFor="refund-relatedTransactionId" required>Original Expense</Label>
        <div className="relative">
          <select
            id="refund-relatedTransactionId"
            disabled={isLoading || isEditMode}
            className={cn(
              selectClass,
              errors.relatedTransactionId && 'border-red-500/60 focus:ring-red-500',
              isEditMode && 'opacity-60 cursor-not-allowed'
            )}
            {...register('relatedTransactionId')}
          >
            {expenses.map((e) => (
              <option key={e.id} value={e.id} className="bg-slate-800">
                {e.description} — {e.transactionDate} — {formatCurrency(e.amount)}
                {e.fullyRefunded ? ' (Fully Refunded)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        {isEditMode && <p className="mt-1.5 text-xs text-slate-500">The original expense cannot be changed after creation.</p>}
        <FieldError message={errors.relatedTransactionId?.message} />
      </div>

      {/* Selected expense preview */}
      {selectedExpense && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{selectedExpense.description}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedExpense.category?.name ?? 'No category'}
                <span className="mx-1 opacity-50">•</span>
                {selectedExpense.transactionDate}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-rose-400 tabular-nums">{formatCurrency(selectedExpense.amount)}</p>
              {parseFloat(selectedExpense.refundedAmount) > 0 && (
                <p className="text-xs text-teal-400 mt-0.5">
                  Refunded: {formatCurrency(selectedExpense.refundedAmount)}
                </p>
              )}
            </div>
          </div>
          <div className="pt-1.5 border-t border-slate-700/50">
            <p className="text-xs font-medium text-slate-300">
              Remaining refundable:{' '}
              <span className={cn('tabular-nums', selectedExpense.fullyRefunded ? 'text-slate-500' : 'text-teal-400')}>
                {formatCurrency(selectedExpense.remainingRefundable)}
              </span>
            </p>
          </div>
          {selectedExpense.fullyRefunded && (
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
              This expense has been fully refunded.
            </p>
          )}
        </div>
      )}

      {/* Amount */}
      <div>
        <Label htmlFor="refund-amount" required>Refund Amount</Label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none select-none">RM</span>
          <input
            id="refund-amount" type="number" step="0.01" min="0.01" inputMode="decimal" placeholder="0.00"
            disabled={isLoading}
            className={cn(inputClass, 'pl-10 text-lg font-semibold tabular-nums', errors.amount && 'border-red-500/60 focus:ring-red-500')}
            {...register('amount')}
          />
        </div>
        {selectedExpense && !selectedExpense.fullyRefunded && (
          <button
            type="button"
            onClick={() => setValue('amount', selectedExpense.remainingRefundable)}
            className="mt-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            Use remaining: {formatCurrency(selectedExpense.remainingRefundable)}
          </button>
        )}
        <FieldError message={errors.amount?.message} />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="refund-description" required>Description</Label>
        <input
          id="refund-description" type="text" placeholder="e.g. Refund: Dinner"
          disabled={isLoading}
          className={cn(inputClass, errors.description && 'border-red-500/60 focus:ring-red-500')}
          {...register('description')}
        />
        <FieldError message={errors.description?.message} />
      </div>

      {/* Received Into */}
      <div>
        <Label htmlFor="refund-accountId" required>Received Into</Label>
        <div className="relative">
          <select
            id="refund-accountId" disabled={isLoading}
            className={cn(selectClass, errors.accountId && 'border-red-500/60 focus:ring-red-500')}
            {...register('accountId')}
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-slate-800">
                {acc.name}{acc.active === false ? ' (Archived)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        <FieldError message={errors.accountId?.message} />
      </div>

      {/* Date */}
      <div>
        <Label htmlFor="refund-transactionDate" required>Date</Label>
        <DateInput
          id="refund-transactionDate" disabled={isLoading}
          className={cn(inputClass, errors.transactionDate && 'border-red-500/60 focus:ring-red-500')}
          {...register('transactionDate')}
        />
        <FieldError message={errors.transactionDate?.message} />
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="refund-notes">Notes</Label>
        <textarea
          id="refund-notes" rows={3} placeholder="Optional notes…" disabled={isLoading}
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
            'py-3 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-950/40 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm min-h-[44px]',
            isEditMode && cancelHref ? 'flex-1' : 'w-full'
          )}
        >
          {isLoading ? (
            <><Loader2 className="animate-spin h-4 w-4" />Saving…</>
          ) : isEditMode ? (
            'Save Changes'
          ) : (
            <><RotateCcw className="h-4 w-4" />Record Refund</>
          )}
        </button>
      </div>
    </form>
  )
}
