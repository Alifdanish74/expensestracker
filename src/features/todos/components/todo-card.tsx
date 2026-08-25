'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Edit3, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { setTodoCompletedAction } from '../server/todo-actions'
import { DeleteTodoDialog } from './delete-todo-dialog'
import {
  getDueStatus,
  formatDueDate,
  formatCompletedAt,
  type TodoDueStatus,
} from '../utils/todo-date-utils'
import type { TodoItem } from '../server/todo-service'

interface TodoCardProps {
  todo: TodoItem
}

// ── Due Status Badge ──────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<TodoDueStatus, string> = {
  OVERDUE: 'bg-red-500/10 border-red-500/30 text-red-400',
  DUE_TODAY: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  UPCOMING: 'bg-slate-700/40 border-slate-700 text-slate-400',
  NO_DATE: 'bg-slate-800/40 border-slate-700/50 text-slate-500',
}

// ── Active Todo Card ──────────────────────────────────────────────────────────

export function ActiveTodoCard({ todo }: TodoCardProps) {
  const [isPending, startTransition] = useTransition()
  const status = getDueStatus(todo.dueDate)
  const formattedDate = formatDueDate(todo.dueDate)

  function handleComplete() {
    startTransition(async () => {
      await setTodoCompletedAction(todo.id, true)
    })
  }

  return (
    <div
      className={cn(
        'bg-slate-900 border rounded-2xl p-4 transition-all',
        isPending ? 'opacity-60 border-slate-800' : 'border-slate-800 hover:border-slate-700',
        status === 'OVERDUE' && !isPending && 'border-red-500/20'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Completion checkbox */}
        <button
          type="button"
          onClick={handleComplete}
          disabled={isPending}
          aria-label={`Mark "${todo.title}" as complete`}
          className={cn(
            'flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all min-w-[24px]',
            'border-slate-600 hover:border-violet-400 hover:bg-violet-400/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <span className="sr-only">Mark complete</span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-semibold text-slate-100 leading-snug">{todo.title}</p>

          {/* Due date badge */}
          <div className="flex flex-wrap items-center gap-2">
            {status === 'OVERDUE' && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                  STATUS_CLASSES.OVERDUE
                )}
                aria-label="Overdue task"
              >
                Overdue
              </span>
            )}
            {status === 'DUE_TODAY' && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                  STATUS_CLASSES.DUE_TODAY
                )}
              >
                Due Today
              </span>
            )}
            {formattedDate ? (
              <span className="text-xs text-slate-500">
                {status === 'OVERDUE' ? `Due ${formattedDate}` : status === 'DUE_TODAY' ? formattedDate : `Due ${formattedDate}`}
              </span>
            ) : (
              <span className="text-xs text-slate-600">No due date</span>
            )}
          </div>

          {/* Description preview */}
          {todo.description && (
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{todo.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Link
            href={`/todos/${todo.id}/edit`}
            className="p-2 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 active:bg-violet-500/20 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label={`Edit todo: ${todo.title}`}
            title="Edit"
          >
            <Edit3 className="h-4 w-4" aria-hidden="true" />
          </Link>
          <DeleteTodoDialog todoId={todo.id} todoTitle={todo.title} />
        </div>
      </div>
    </div>
  )
}

// ── Completed Todo Card ───────────────────────────────────────────────────────

export function CompletedTodoCard({ todo }: TodoCardProps) {
  const [isPending, startTransition] = useTransition()
  const completedText = formatCompletedAt(todo.completedAt)

  function handleReopen() {
    startTransition(async () => {
      await setTodoCompletedAction(todo.id, false)
    })
  }

  return (
    <div
      className={cn(
        'bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 transition-all',
        isPending && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Completed checkmark / reopen control */}
        <button
          type="button"
          onClick={handleReopen}
          disabled={isPending}
          aria-label={`Reopen todo: ${todo.title}`}
          title="Reopen"
          className={cn(
            'flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all min-w-[24px]',
            'border-slate-600 bg-slate-700/40 hover:border-amber-400 hover:bg-amber-400/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Check className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <span className="sr-only">Reopen todo</span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium text-slate-500 line-through leading-snug">{todo.title}</p>
          <p className="text-xs text-slate-600">
            {completedText ? `Completed ${completedText}` : 'Completed'}
          </p>
          {todo.description && (
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-1">{todo.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Link
            href={`/todos/${todo.id}/edit`}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-slate-700/30 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label={`Edit todo: ${todo.title}`}
            title="Edit"
          >
            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <DeleteTodoDialog todoId={todo.id} todoTitle={todo.title} />
        </div>
      </div>
    </div>
  )
}
