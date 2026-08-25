'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ChevronDown, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DateInput } from '@/components/ui/date-input'
import { installmentSchema, type InstallmentFormValues } from '../schemas/installment-schema'
import type { InstallmentActionResult } from '../server/installment-actions'

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

interface InstallmentFormProps {
  categories: CategoryOption[]
  accounts: AccountOption[]
  onSubmit: (values: InstallmentFormValues) => Promise<InstallmentActionResult>
  mode?: 'create' | 'edit'
  initialData?: Partial<InstallmentFormValues>
  installmentId?: string
  cancelHref?: string
  hasPaymentHistory?: boolean
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
  optional,
}: {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
  optional?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
    >
      {children}
      {required && <span className="text-rose-400 ml-0.5">*</span>}
      {optional && (
        <span className="text-slate-500 text-[10px] font-normal normal-case tracking-normal ml-1.5">
          Optional
        </span>
      )}
    </label>
  )
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 text-sm min-h-[44px]'

const selectClass = cn(inputClass, 'appearance-none pr-9 cursor-pointer')

export function InstallmentForm({
  categories,
  accounts,
  onSubmit,
  mode = 'create',
  initialData,
  installmentId,
  cancelHref,
  hasPaymentHistory = false,
}: InstallmentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEditMode = mode === 'edit'
  const hasCategories = categories.length > 0

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InstallmentFormValues>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      monthlyAmount: initialData?.monthlyAmount ?? '',
      categoryId: initialData?.categoryId ?? categories[0]?.id ?? '',
      accountId: initialData?.accountId ?? '',
      remainingPayments: initialData?.remainingPayments ?? 1,
      totalPayments: initialData?.totalPayments ?? '',
      dueDay: initialData?.dueDay ?? 1,
      startDate: initialData?.startDate ?? todayDateString(),
      notes: initialData?.notes ?? '',
    },
  })

  const isLoading = isSubmitting || isPending

  const handleFormSubmit = async (values: InstallmentFormValues) => {
    setServerError(null)
    const result = await onSubmit(values)
    if (!result.success) {
      setServerError(result.error)
      return
    }
    startTransition(() => {
      if (isEditMode && installmentId) {
        router.push(`/installments/${installmentId}`)
        router.refresh()
      } else {
        router.push('/installments')
        router.refresh()
      }
    })
  }

  if (!hasCategories) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
        <p className="text-sm text-slate-400">
          No categories available. Please configure your categories before adding an instalment.
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
        <Label htmlFor="inst-name" required>
          Name
        </Label>
        <input
          id="inst-name"
          type="text"
          placeholder="e.g. MacBook M4, Washing Machine"
          disabled={isLoading}
          className={cn(inputClass, errors.name && 'border-rose-500/60 focus:ring-rose-500')}
          {...register('name')}
        />
        <FieldError message={errors.name?.message} />
      </div>

      {/* 2. Monthly Amount */}
      <div>
        <Label htmlFor="inst-monthlyAmount" required>
          Monthly Amount
        </Label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none select-none">
            RM
          </span>
          <input
            id="inst-monthlyAmount"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            placeholder="0.00"
            disabled={isLoading}
            className={cn(
              inputClass,
              'pl-10 text-lg font-semibold tabular-nums',
              errors.monthlyAmount && 'border-rose-500/60 focus:ring-rose-500'
            )}
            {...register('monthlyAmount')}
          />
        </div>
        <FieldError message={errors.monthlyAmount?.message} />
      </div>

      {/* 3. Category */}
      <div>
        <Label htmlFor="inst-categoryId" required>
          Category
        </Label>
        <div className="relative">
          <select
            id="inst-categoryId"
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

      {/* 4. Remaining Payments */}
      <div>
        <Label htmlFor="inst-remainingPayments" required>
          Payments Remaining
        </Label>
        {hasPaymentHistory ? (
          <div className="space-y-1.5">
            <div className="relative flex items-center">
              <input
                id="inst-remainingPayments"
                type="number"
                disabled
                className={cn(
                  inputClass,
                  'bg-slate-800/40 text-slate-400 border-slate-800 cursor-not-allowed pr-9 font-semibold'
                )}
                {...register('remainingPayments', { valueAsNumber: true })}
              />
              <Lock className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" />
            </div>
            <p className="text-xs text-indigo-400/90 flex items-center gap-1 font-medium bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl">
              <Lock className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />
              Managed automatically from completed monthly payments.
            </p>
          </div>
        ) : (
          <>
            <input
              id="inst-remainingPayments"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="e.g. 3"
              disabled={isLoading}
              className={cn(
                inputClass,
                errors.remainingPayments && 'border-rose-500/60 focus:ring-rose-500'
              )}
              {...register('remainingPayments', { valueAsNumber: true })}
            />
            <p className="text-xs text-slate-400 mt-1">
              Number of full payments still outstanding.
            </p>
            <FieldError message={errors.remainingPayments?.message} />
          </>
        )}
      </div>

      {/* 5. Total Payments (Optional) */}
      <div>
        <Label htmlFor="inst-totalPayments" optional>
          Total Payments
        </Label>
        <input
          id="inst-totalPayments"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          placeholder="e.g. 12"
          disabled={isLoading}
          className={cn(
            inputClass,
            errors.totalPayments && 'border-rose-500/60 focus:ring-rose-500'
          )}
          {...register('totalPayments')}
        />
        <p className="text-xs text-slate-400 mt-1">
          Leave blank if you only know how many payments remain.
        </p>
        <FieldError message={errors.totalPayments?.message} />
      </div>

      {/* 6. Due Day */}
      <div>
        <Label htmlFor="inst-dueDay" required>
          Due Day of Month (1–31)
        </Label>
        <input
          id="inst-dueDay"
          type="number"
          min="1"
          max="31"
          step="1"
          inputMode="numeric"
          placeholder="e.g. 15"
          disabled={isLoading}
          className={cn(inputClass, errors.dueDay && 'border-rose-500/60 focus:ring-rose-500')}
          {...register('dueDay', { valueAsNumber: true })}
        />
        <p className="text-xs text-slate-400 mt-1">
          Day of month this instalment is due. Short-month clamping will be applied when payments are generated.
        </p>
        <FieldError message={errors.dueDay?.message} />
      </div>

      {/* 7. Default Payment Account (Optional) */}
      <div>
        <Label htmlFor="inst-accountId" optional>
          Default Payment Account
        </Label>
        <div className="relative">
          <select
            id="inst-accountId"
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

      {/* 8. Tracking Start Date */}
      <div>
        <Label htmlFor="inst-startDate" required>
          Tracking Start Date
        </Label>
        <DateInput
          id="inst-startDate"
          disabled={isLoading}
          className={cn(
            inputClass,
            errors.startDate && 'border-rose-500/60 focus:ring-rose-500'
          )}
          {...register('startDate')}
        />
        <p className="text-xs text-slate-400 mt-1">
          The date from which this instalment starts participating in the tracker.
        </p>
        <FieldError message={errors.startDate?.message} />
      </div>

      {/* 9. Notes (Optional) */}
      <div>
        <Label htmlFor="inst-notes" optional>
          Notes
        </Label>
        <textarea
          id="inst-notes"
          rows={3}
          placeholder="e.g. Purchased from Senheng, 0% credit-card instalment"
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
            href={cancelHref ?? '/installments'}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all text-sm min-h-[44px] flex items-center justify-center border border-slate-700"
          >
            Cancel
          </Link>
        ) : null}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-950/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm min-h-[44px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Saving…
            </>
          ) : isEditMode ? (
            'Save Changes'
          ) : (
            'Save Instalment'
          )}
        </button>
      </div>
    </form>
  )
}
