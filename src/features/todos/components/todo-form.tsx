'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { DateInput } from '@/components/ui/date-input'
import { todoSchema, type TodoFormValues } from '../schemas/todo-schema'
import type { TodoActionResult } from '../server/todo-actions'

interface TodoFormProps {
  onSubmit: (values: TodoFormValues) => Promise<TodoActionResult>
  mode: 'create' | 'edit'
  initialData?: Partial<TodoFormValues>
  cancelHref?: string
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1.5 text-xs text-red-400" role="alert" aria-live="polite">
      {message}
    </p>
  )
}

// ── Main Form ─────────────────────────────────────────────────────────────────

export function TodoForm({ onSubmit, mode, initialData, cancelHref = '/todos' }: TodoFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      dueDate: initialData?.dueDate ?? '',
    },
  })

  const isLoading = isSubmitting || isPending

  function onFormSubmit(values: TodoFormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await onSubmit(values)
      if (!result.success) {
        setServerError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5" noValidate>
      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-medium text-red-400"
        >
          {serverError}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="todo-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Title <span className="text-rose-400" aria-hidden="true">*</span>
        </label>
        <input
          id="todo-title"
          type="text"
          placeholder="e.g. Renew road tax"
          disabled={isLoading}
          autoFocus={mode === 'create'}
          className={cn(
            'w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50 text-sm',
            errors.title ? 'border-red-500/50' : 'border-slate-700/80'
          )}
          {...register('title')}
        />
        <FieldError message={errors.title?.message} />
      </div>

      {/* Due Date */}
      <div className="space-y-1.5">
        <label htmlFor="todo-dueDate" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Due Date <span className="text-slate-500 font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <DateInput
          id="todo-dueDate"
          disabled={isLoading}
          className={cn(
            'w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50 text-sm min-h-[44px]',
            errors.dueDate && 'border-red-500/50'
          )}
          {...register('dueDate')}
        />
        <p className="text-xs text-slate-500">Leave blank for no due date.</p>
        <FieldError message={errors.dueDate?.message} />
      </div>

      {/* Notes / Description */}
      <div className="space-y-1.5">
        <label htmlFor="todo-notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Notes <span className="text-slate-500 font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          id="todo-notes"
          rows={4}
          placeholder="Add any extra notes or details..."
          disabled={isLoading}
          className={cn(
            'w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50 text-sm resize-none leading-relaxed',
            errors.description ? 'border-red-500/50' : 'border-slate-700/80'
          )}
          {...register('description')}
        />
        <FieldError message={errors.description?.message} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Link
          href={cancelHref}
          className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-semibold rounded-xl transition-all text-sm text-center border border-slate-700 min-h-[48px] flex items-center justify-center"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 px-4 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold rounded-xl transition-all text-sm min-h-[48px] flex items-center justify-center gap-2 shadow-lg shadow-violet-950/40 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" aria-hidden="true" />
              {mode === 'create' ? 'Adding…' : 'Saving…'}
            </>
          ) : (
            <>{mode === 'create' ? 'Add Todo' : 'Save Changes'}</>
          )}
        </button>
      </div>
    </form>
  )
}
