'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DateInput } from '@/components/ui/date-input'
import { expenseSchema, type ExpenseFormValues } from '../schemas/expense-schema'
import type { ExpenseActionResult } from '../server/transaction-actions'

interface AccountOption {
  id: string
  name: string
  institutionName: string | null
  /** True if the account is archived (only present for the currently-linked account in edit mode) */
  active?: boolean
}

interface CategoryOption {
  id: string
  name: string
  essentialDefault: boolean
  /** True if the category is archived */
  active?: boolean
}

interface ExpenseFormProps {
  accounts: AccountOption[]
  categories: CategoryOption[]
  onSubmit: (values: ExpenseFormValues) => Promise<ExpenseActionResult>
  /** "create" (default) | "edit" */
  mode?: 'create' | 'edit'
  /** Pre-populate form values in edit mode */
  initialData?: Partial<ExpenseFormValues>
  /** Transaction ID — used in edit mode to redirect to detail page after save */
  transactionId?: string
  /** URL to return to after cancel in edit mode */
  cancelHref?: string
}

// Returns today's date as YYYY-MM-DD in local time
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
    <p className="mt-1.5 text-xs text-red-400" role="alert" aria-live="polite">
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
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50 text-sm min-h-[44px]'

const selectClass = cn(inputClass, 'appearance-none pr-9 cursor-pointer')

export function ExpenseForm({
  accounts,
  categories,
  onSubmit,
  mode = 'create',
  initialData,
  transactionId,
  cancelHref,
}: ExpenseFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  // Track if the user has manually changed the essential toggle (suppresses auto-sync in edit mode)
  const userChangedEssential = useRef(false)

  const isEditMode = mode === 'edit'
  const hasAccounts = accounts.length > 0
  const hasCategories = categories.length > 0

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: initialData?.amount ?? '',
      description: initialData?.description ?? '',
      categoryId: initialData?.categoryId ?? categories[0]?.id ?? '',
      accountId: initialData?.accountId ?? accounts[0]?.id ?? '',
      transactionDate: initialData?.transactionDate ?? todayDateString(),
      essential: initialData?.essential ?? categories[0]?.essentialDefault ?? false,
      notes: initialData?.notes ?? '',
    },
  })

  const selectedCategoryId = watch('categoryId')
  const essential = watch('essential')
  const isLoading = isSubmitting || isPending

  // In create mode: auto-set essential toggle when category changes.
  // In edit mode: only auto-set if the user hasn't manually touched the toggle.
  useEffect(() => {
    if (isEditMode && userChangedEssential.current) return
    const cat = categories.find((c) => c.id === selectedCategoryId)
    if (cat && !isEditMode) {
      setValue('essential', cat.essentialDefault, { shouldDirty: false })
    }
  }, [selectedCategoryId, categories, setValue, isEditMode])

  const handleEssentialToggle = () => {
    userChangedEssential.current = true
    setValue('essential', !essential)
  }

  const handleFormSubmit = async (values: ExpenseFormValues) => {
    setServerError(null)
    const result = await onSubmit(values)
    if (!result.success) {
      setServerError(result.error)
      return
    }
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
      <div className="text-center py-8 space-y-4">
        <p className="text-sm text-slate-400">
          You need at least one account before adding an expense.
        </p>
        <Link
          href="/accounts/new"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all min-h-[44px]"
        >
          Add Account
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div
          className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-sm"
          role="alert"
        >
          {serverError}
        </div>
      )}

      {/* Amount — prominent input */}
      <div>
        <Label htmlFor="amount" required>
          Amount
        </Label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none select-none">
            RM
          </span>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            placeholder="0.00"
            disabled={isLoading}
            className={cn(
              inputClass,
              'pl-10 text-lg font-semibold tabular-nums',
              errors.amount && 'border-red-500/60 focus:ring-red-500'
            )}
            {...register('amount')}
          />
        </div>
        <FieldError message={errors.amount?.message} />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" required>
          Description
        </Label>
        <input
          id="description"
          type="text"
          placeholder="e.g. Dinner, Petrol, Groceries"
          disabled={isLoading}
          className={cn(inputClass, errors.description && 'border-red-500/60 focus:ring-red-500')}
          {...register('description')}
        />
        <FieldError message={errors.description?.message} />
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="categoryId" required>
          Category
        </Label>
        {!hasCategories ? (
          <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
            No categories available. Please reload the page.
          </p>
        ) : (
          <>
            <div className="relative">
              <select
                id="categoryId"
                disabled={isLoading}
                className={cn(
                  selectClass,
                  errors.categoryId && 'border-red-500/60 focus:ring-red-500'
                )}
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
          </>
        )}
      </div>

      {/* Account */}
      <div>
        <Label htmlFor="accountId" required>
          Paid Using
        </Label>
        <div className="relative">
          <select
            id="accountId"
            disabled={isLoading}
            className={cn(
              selectClass,
              errors.accountId && 'border-red-500/60 focus:ring-red-500'
            )}
            {...register('accountId')}
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-slate-800">
                {acc.name}
                {acc.active === false ? ' (Archived)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        <FieldError message={errors.accountId?.message} />
      </div>

      {/* Date */}
      <div>
        <Label htmlFor="transactionDate" required>
          Date
        </Label>
        <DateInput
          id="transactionDate"
          disabled={isLoading}
          className={cn(
            inputClass,
            errors.transactionDate && 'border-red-500/60 focus:ring-red-500'
          )}
          {...register('transactionDate')}
        />
        <FieldError message={errors.transactionDate?.message} />
      </div>

      {/* Essential toggle */}
      <div className="flex items-center justify-between py-3 border-b border-slate-800">
        <div>
          <p className="text-sm font-medium text-slate-200">Essential</p>
          <p className="text-xs text-slate-500 mt-0.5">Mark if this is a necessary expense</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={essential}
          aria-label={essential ? 'Essential: on' : 'Essential: off'}
          onClick={handleEssentialToggle}
          disabled={isLoading}
          className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-end"
        >
          {essential ? (
            <ToggleRight className="h-8 w-8 text-emerald-400" />
          ) : (
            <ToggleLeft className="h-8 w-8" />
          )}
        </button>
      </div>

      {/* Notes */}
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
            errors.notes && 'border-red-500/60 focus:ring-red-500'
          )}
          {...register('notes')}
        />
        <FieldError message={errors.notes?.message} />
      </div>

      {/* Actions */}
      <div className={cn('pt-2', isEditMode && 'flex gap-3')}>
        {isEditMode && cancelHref && (
          <Link
            href={cancelHref}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all text-sm min-h-[44px] flex items-center justify-center border border-slate-700"
          >
            Cancel
          </Link>
        )}
        <button
          type="submit"
          disabled={isLoading || !hasAccounts || !hasCategories}
          className={cn(
            'py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm min-h-[44px]',
            isEditMode && cancelHref ? 'flex-1' : 'w-full'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              {isEditMode ? 'Saving…' : 'Saving…'}
            </>
          ) : isEditMode ? (
            'Save Changes'
          ) : (
            'Save Expense'
          )}
        </button>
      </div>
    </form>
  )
}
