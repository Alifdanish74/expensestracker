'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DateInput } from '@/components/ui/date-input'
import { commitmentSchema, type CommitmentFormValues } from '../schemas/commitment-schema'
import type { CommitmentActionResult } from '../server/commitment-actions'

interface CategoryOption {
  id: string
  name: string
  active?: boolean
}

interface AccountOption {
  id: string
  name: string
  institutionName: string | null
  active?: boolean
}

interface CommitmentFormProps {
  categories: CategoryOption[]
  accounts: AccountOption[]
  onSubmit: (values: CommitmentFormValues) => Promise<CommitmentActionResult>
  mode?: 'create' | 'edit'
  initialData?: Partial<CommitmentFormValues>
  commitmentId?: string
  cancelHref?: string
}

function todayDateString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1.5 text-xs text-rose-400" role="alert" aria-live="polite">
      {message}
    </p>
  )
}

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
    >
      {children}
      {required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
  )
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50 text-sm min-h-[44px]'

const selectClass = cn(inputClass, 'appearance-none pr-9 cursor-pointer')

export function CommitmentForm({
  categories,
  accounts,
  onSubmit,
  mode = 'create',
  initialData,
  commitmentId,
  cancelHref,
}: CommitmentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEditMode = mode === 'edit'
  const hasCategories = categories.length > 0

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CommitmentFormValues>({
    resolver: zodResolver(commitmentSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      defaultAmount: initialData?.defaultAmount ?? '',
      categoryId: initialData?.categoryId ?? categories[0]?.id ?? '',
      accountId: initialData?.accountId ?? '',
      dueDay: initialData?.dueDay ?? 1,
      variableAmount: initialData?.variableAmount ?? false,
      transferToWife: initialData?.transferToWife ?? false,
      startDate: initialData?.startDate ?? todayDateString(),
      endDate: initialData?.endDate ?? '',
      notes: initialData?.notes ?? '',
    },
  })

  const variableAmount = watch('variableAmount')
  const transferToWife = watch('transferToWife')
  const isLoading = isSubmitting || isPending

  const handleFormSubmit = async (values: CommitmentFormValues) => {
    setServerError(null)
    const result = await onSubmit(values)
    if (!result.success) {
      setServerError(result.error)
      return
    }
    startTransition(() => {
      if (isEditMode && commitmentId) {
        router.push(`/commitments/${commitmentId}`)
        router.refresh()
      } else {
        router.push('/commitments')
        router.refresh()
      }
    })
  }

  if (!hasCategories) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
        <p className="text-sm text-slate-400">
          No categories available. Please configure your categories before adding a commitment.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div
          className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-sm"
          role="alert"
        >
          {serverError}
        </div>
      )}

      {/* 1. Name */}
      <div>
        <Label htmlFor="name" required>
          Name
        </Label>
        <input
          id="name"
          type="text"
          placeholder="e.g. House, WiFi, Motorcycle, Groceries"
          disabled={isLoading}
          className={cn(inputClass, errors.name && 'border-rose-500/60 focus:ring-rose-500')}
          {...register('name')}
        />
        <FieldError message={errors.name?.message} />
      </div>

      {/* 2. Default Monthly Amount */}
      <div>
        <Label htmlFor="defaultAmount" required>
          Default Monthly Amount
        </Label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none select-none">
            RM
          </span>
          <input
            id="defaultAmount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            disabled={isLoading}
            className={cn(
              inputClass,
              'pl-10 text-lg font-semibold tabular-nums',
              errors.defaultAmount && 'border-rose-500/60 focus:ring-rose-500'
            )}
            {...register('defaultAmount')}
          />
        </div>
        <FieldError message={errors.defaultAmount?.message} />
      </div>

      {/* 3. Category */}
      <div>
        <Label htmlFor="categoryId" required>
          Category
        </Label>
        <div className="relative">
          <select
            id="categoryId"
            disabled={isLoading}
            className={cn(selectClass, errors.categoryId && 'border-rose-500/60 focus:ring-rose-500')}
            {...register('categoryId')}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-slate-800">
                {cat.name}
                {cat.active === false ? ' (Archived)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        <FieldError message={errors.categoryId?.message} />
      </div>

      {/* 4. Due Day */}
      <div>
        <Label htmlFor="dueDay" required>
          Due Day of Month (1–31)
        </Label>
        <input
          id="dueDay"
          type="number"
          min="1"
          max="31"
          placeholder="e.g. 1"
          disabled={isLoading}
          className={cn(inputClass, errors.dueDay && 'border-rose-500/60 focus:ring-rose-500')}
          {...register('dueDay', { valueAsNumber: true })}
        />
        <FieldError message={errors.dueDay?.message} />
      </div>

      {/* 5. Default Payment Account (Optional) */}
      <div>
        <Label htmlFor="accountId">
          Default Payment Account (Optional)
        </Label>
        <div className="relative">
          <select
            id="accountId"
            disabled={isLoading}
            className={cn(selectClass, errors.accountId && 'border-rose-500/60 focus:ring-rose-500')}
            {...register('accountId')}
          >
            <option value="" className="bg-slate-800">
              None (No default payment account)
            </option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-slate-800">
                {acc.name}
                {acc.institutionName ? ` (${acc.institutionName})` : ''}
                {acc.active === false ? ' (Archived)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        <FieldError message={errors.accountId?.message} />
      </div>

      {/* 6. Variable Amount Switch */}
      <div className="flex items-center justify-between py-3 border-t border-b border-slate-800/80">
        <div>
          <p className="text-sm font-medium text-slate-200">Amount Can Vary Monthly</p>
          <p className="text-xs text-slate-400 mt-0.5">
            ON: Default amount is an expected/reference amount that may change monthly.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={variableAmount}
          aria-label={variableAmount ? 'Variable Amount: on' : 'Variable Amount: off'}
          onClick={() => setValue('variableAmount', !variableAmount)}
          disabled={isLoading}
          className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-end"
        >
          {variableAmount ? (
            <ToggleRight className="h-8 w-8 text-purple-400" />
          ) : (
            <ToggleLeft className="h-8 w-8" />
          )}
        </button>
      </div>

      {/* 7. Transfer to Wife Switch */}
      <div className="flex items-center justify-between py-3 border-b border-slate-800/80">
        <div>
          <p className="text-sm font-medium text-slate-200">Transfer to Wife</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Metadata flag for obligations handled via transfer to wife.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={transferToWife}
          aria-label={transferToWife ? 'Transfer to Wife: on' : 'Transfer to Wife: off'}
          onClick={() => setValue('transferToWife', !transferToWife)}
          disabled={isLoading}
          className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-end"
        >
          {transferToWife ? (
            <ToggleRight className="h-8 w-8 text-rose-400" />
          ) : (
            <ToggleLeft className="h-8 w-8" />
          )}
        </button>
      </div>

      {/* 8. Start Date */}
      <div>
        <Label htmlFor="startDate" required>
          Start Date
        </Label>
        <DateInput
          id="startDate"
          disabled={isLoading}
          className={cn(
            inputClass,
            errors.startDate && 'border-rose-500/60 focus:ring-rose-500'
          )}
          {...register('startDate')}
        />
        <FieldError message={errors.startDate?.message} />
      </div>

      {/* 9. End Date (Optional) */}
      <div>
        <Label htmlFor="endDate">
          End Date (Optional)
        </Label>
        <DateInput
          id="endDate"
          disabled={isLoading}
          className={cn(
            inputClass,
            errors.endDate && 'border-rose-500/60 focus:ring-rose-500'
          )}
          {...register('endDate')}
        />
        <p className="text-xs text-slate-400 mt-1">Leave empty for no planned end date.</p>
        <FieldError message={errors.endDate?.message} />
      </div>

      {/* 10. Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Optional notes…"
          disabled={isLoading}
          className={cn(
            inputClass,
            'resize-none min-h-[88px]',
            errors.notes && 'border-rose-500/60 focus:ring-rose-500'
          )}
          {...register('notes')}
        />
        <FieldError message={errors.notes?.message} />
      </div>

      {/* Form Action Buttons */}
      <div className={cn('pt-2 flex gap-3')}>
        {(isEditMode && cancelHref) || !isEditMode ? (
          <Link
            href={cancelHref ?? '/commitments'}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all text-sm min-h-[44px] flex items-center justify-center border border-slate-700"
          >
            Cancel
          </Link>
        ) : null}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm min-h-[44px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Saving…
            </>
          ) : isEditMode ? (
            'Save Changes'
          ) : (
            'Save Commitment'
          )}
        </button>
      </div>
    </form>
  )
}
