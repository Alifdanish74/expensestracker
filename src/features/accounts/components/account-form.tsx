'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Loader2,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { accountSchema, type AccountFormValues } from '../schemas/account-schema'
import { ACCOUNT_TYPE_OPTIONS, CREDIT_CARD_TYPES, HAS_DUE_DAY_TYPES, HAS_INSTITUTION_TYPES } from '../utils/account-type'
import type { AccountType } from '@/generated/prisma/client'
import type { ActionResult } from '../server/account-actions'
import type { Account } from '@/generated/prisma/client'

interface AccountFormProps {
  initialData?: Account
  onSubmit: (values: AccountFormValues) => Promise<ActionResult>
  submitLabel?: string
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

export function AccountForm({ initialData, onSubmit, submitLabel = 'Save Account' }: AccountFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const defaultValues: AccountFormValues = {
    name: initialData?.name ?? '',
    institutionName: initialData?.institutionName ?? '',
    type: (initialData?.type as AccountType) ?? 'BANK_ACCOUNT',
    lastFourDigits: initialData?.lastFourDigits ?? '',
    currentBalance: initialData?.currentBalance?.toString() ?? '0',
    creditLimit: initialData?.creditLimit?.toString() ?? '',
    statementDay: initialData?.statementDay?.toString() ?? '',
    dueDay: initialData?.dueDay?.toString() ?? '',
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues,
  })

  const selectedType = watch('type') as AccountType
  const isCreditCard = CREDIT_CARD_TYPES.includes(selectedType)
  const hasDueDay = HAS_DUE_DAY_TYPES.includes(selectedType)
  const hasInstitution = HAS_INSTITUTION_TYPES.includes(selectedType)
  const isLoading = isSubmitting || isPending

  const handleFormSubmit = async (values: AccountFormValues) => {
    setServerError(null)
    setSuccessMessage(null)

    const result = await onSubmit(values)
    if (!result.success) {
      setServerError(result.error)
      return
    }

    setSuccessMessage(initialData ? 'Account updated!' : 'Account created!')
    startTransition(() => {
      router.push('/accounts')
      router.refresh()
    })
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
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-sm">
          {successMessage}
        </div>
      )}

      {/* Account Name */}
      <div>
        <Label htmlFor="name" required>Account Name</Label>
        <input
          id="name"
          type="text"
          placeholder="e.g. UOB Credit Card"
          disabled={isLoading}
          className={cn(inputClass, errors.name && 'border-red-500/60 focus:ring-red-500')}
          {...register('name')}
        />
        <FieldError message={errors.name?.message} />
      </div>

      {/* Account Type */}
      <div>
        <Label htmlFor="type" required>Account Type</Label>
        <div className="relative">
          <select
            id="type"
            disabled={isLoading}
            className={cn(
              inputClass,
              'appearance-none pr-9 cursor-pointer',
              errors.type && 'border-red-500/60 focus:ring-red-500'
            )}
            {...register('type')}
          >
            {ACCOUNT_TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value} className="bg-slate-800">
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        <FieldError message={errors.type?.message} />
      </div>

      {/* Institution Name — shown for most account types */}
      {hasInstitution && (
        <div>
          <Label htmlFor="institutionName">Institution</Label>
          <input
            id="institutionName"
            type="text"
            placeholder="e.g. UOB, Maybank, Shopee"
            disabled={isLoading}
            className={cn(inputClass, errors.institutionName && 'border-red-500/60 focus:ring-red-500')}
            {...register('institutionName')}
          />
          <FieldError message={errors.institutionName?.message} />
        </div>
      )}

      {/* Current Balance */}
      <div>
        <Label htmlFor="currentBalance">Current Balance (RM)</Label>
        <input
          id="currentBalance"
          type="number"
          step="0.01"
          placeholder="0.00"
          disabled={isLoading}
          className={cn(inputClass, errors.currentBalance && 'border-red-500/60 focus:ring-red-500')}
          {...register('currentBalance')}
        />
        <p className="mt-1.5 text-xs text-slate-500">Enter your current or starting balance. Can be negative.</p>
        <FieldError message={errors.currentBalance?.message} />
      </div>

      {/* Credit Card Specific Fields */}
      {isCreditCard && (
        <div className="space-y-5 border-t border-slate-700/50 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Credit Card Details
          </p>

          {/* Last 4 Digits */}
          <div>
            <Label htmlFor="lastFourDigits">Last 4 Digits</Label>
            <input
              id="lastFourDigits"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              disabled={isLoading}
              className={cn(inputClass, errors.lastFourDigits && 'border-red-500/60 focus:ring-red-500')}
              {...register('lastFourDigits')}
            />
            <p className="mt-1.5 text-xs text-slate-500">Last 4 digits only — no full card numbers.</p>
            <FieldError message={errors.lastFourDigits?.message} />
          </div>

          {/* Credit Limit */}
          <div>
            <Label htmlFor="creditLimit">Credit Limit (RM)</Label>
            <input
              id="creditLimit"
              type="number"
              step="0.01"
              min="0"
              placeholder="8000.00"
              disabled={isLoading}
              className={cn(inputClass, errors.creditLimit && 'border-red-500/60 focus:ring-red-500')}
              {...register('creditLimit')}
            />
            <FieldError message={errors.creditLimit?.message} />
          </div>

          {/* Statement Day */}
          <div>
            <Label htmlFor="statementDay">Statement Day</Label>
            <input
              id="statementDay"
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              placeholder="12"
              disabled={isLoading}
              className={cn(inputClass, errors.statementDay && 'border-red-500/60 focus:ring-red-500')}
              {...register('statementDay')}
            />
            <p className="mt-1.5 text-xs text-slate-500">Day of month your statement is generated (1–31).</p>
            <FieldError message={errors.statementDay?.message} />
          </div>
        </div>
      )}

      {/* Due Day — Credit Card + Financing */}
      {hasDueDay && (
        <div>
          <Label htmlFor="dueDay">Due Day</Label>
          <input
            id="dueDay"
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            placeholder="18"
            disabled={isLoading}
            className={cn(inputClass, errors.dueDay && 'border-red-500/60 focus:ring-red-500')}
            {...register('dueDay')}
          />
          <p className="mt-1.5 text-xs text-slate-500">Day of month payment is due (1–31).</p>
          <FieldError message={errors.dueDay?.message} />
        </div>
      )}

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm min-h-[44px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              <span>Saving…</span>
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  )
}
