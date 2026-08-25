'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ChevronDown, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DateInput } from '@/components/ui/date-input'
import { transferSchema, type TransferFormValues } from '../schemas/transfer-schema'
import type { TransferActionResult } from '../server/transfer-actions'

interface AccountOption {
  id: string
  name: string
  institutionName: string | null
  type: string
  active?: boolean
}

interface TransferFormProps {
  accounts: AccountOption[]
  onSubmit: (values: TransferFormValues) => Promise<TransferActionResult>
  mode?: 'create' | 'edit'
  initialData?: Partial<TransferFormValues>
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

const inputClass = 'w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 text-sm min-h-[44px]'
const selectClass = cn(inputClass, 'appearance-none pr-9 cursor-pointer')

export function TransferForm({ accounts, onSubmit, mode = 'create', initialData, transactionId, cancelHref }: TransferFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEditMode = mode === 'edit'
  const hasAccounts = accounts.length >= 2

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: initialData?.amount ?? '',
      description: initialData?.description ?? '',
      accountId: initialData?.accountId ?? accounts[0]?.id ?? '',
      destinationAccountId: initialData?.destinationAccountId ?? accounts[1]?.id ?? '',
      transactionDate: initialData?.transactionDate ?? todayDateString(),
      notes: initialData?.notes ?? '',
    },
  })

  const sourceId = watch('accountId')
  const destId = watch('destinationAccountId')
  const isLoading = isSubmitting || isPending

  const handleFormSubmit = async (values: TransferFormValues) => {
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

  if (!hasAccounts) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-400">You need at least two non-credit-card accounts to record a transfer.</p>
      </div>
    )
  }

  const sourceAccount = accounts.find((a) => a.id === sourceId)
  const destAccount = accounts.find((a) => a.id === destId)

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-sm" role="alert">
          {serverError}
        </div>
      )}

      {/* From / To visual */}
      {sourceId && destId && sourceId !== destId && (
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-blue-300 truncate">{sourceAccount?.name ?? '—'}</span>
          <ArrowRight className="h-4 w-4 text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-blue-300 truncate">{destAccount?.name ?? '—'}</span>
        </div>
      )}

      {/* From */}
      <div>
        <Label htmlFor="transfer-accountId" required>From</Label>
        <div className="relative">
          <select
            id="transfer-accountId" disabled={isLoading}
            className={cn(selectClass, errors.accountId && 'border-red-500/60 focus:ring-red-500')}
            {...register('accountId')}
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-slate-800">{acc.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        <FieldError message={errors.accountId?.message} />
      </div>

      {/* To */}
      <div>
        <Label htmlFor="transfer-destinationAccountId" required>To</Label>
        <div className="relative">
          <select
            id="transfer-destinationAccountId" disabled={isLoading}
            className={cn(selectClass, errors.destinationAccountId && 'border-red-500/60 focus:ring-red-500')}
            {...register('destinationAccountId')}
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-slate-800">{acc.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        <FieldError message={errors.destinationAccountId?.message} />
      </div>

      {/* Amount */}
      <div>
        <Label htmlFor="transfer-amount" required>Amount</Label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none select-none">RM</span>
          <input
            id="transfer-amount" type="number" step="0.01" min="0.01" inputMode="decimal" placeholder="0.00"
            disabled={isLoading}
            className={cn(inputClass, 'pl-10 text-lg font-semibold tabular-nums', errors.amount && 'border-red-500/60 focus:ring-red-500')}
            {...register('amount')}
          />
        </div>
        <FieldError message={errors.amount?.message} />
      </div>

      {/* Date */}
      <div>
        <Label htmlFor="transfer-transactionDate" required>Date</Label>
        <DateInput
          id="transfer-transactionDate" disabled={isLoading}
          className={cn(inputClass, errors.transactionDate && 'border-red-500/60 focus:ring-red-500')}
          {...register('transactionDate')}
        />
        <FieldError message={errors.transactionDate?.message} />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="transfer-description" required>Description</Label>
        <input
          id="transfer-description" type="text" placeholder="e.g. Transfer to Touch 'n Go"
          disabled={isLoading}
          className={cn(inputClass, errors.description && 'border-red-500/60 focus:ring-red-500')}
          {...register('description')}
        />
        <FieldError message={errors.description?.message} />
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="transfer-notes">Notes</Label>
        <textarea
          id="transfer-notes" rows={3} placeholder="Optional notes…" disabled={isLoading}
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
            'py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-950/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm min-h-[44px]',
            isEditMode && cancelHref ? 'flex-1' : 'w-full'
          )}
        >
          {isLoading ? <><Loader2 className="animate-spin h-4 w-4" />Saving…</> : isEditMode ? 'Save Changes' : 'Record Transfer'}
        </button>
      </div>
    </form>
  )
}
