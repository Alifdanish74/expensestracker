'use client'

import Link from 'next/link'
import { Plus, CheckCircle2, Circle } from 'lucide-react'
import { ActiveTodoCard, CompletedTodoCard } from './todo-card'
import type { TodosResult } from '../server/todo-service'

interface TodoListProps {
  todos: TodosResult
}

export function TodoList({ todos }: TodoListProps) {
  const { active, completed } = todos
  const hasAny = active.length > 0 || completed.length > 0

  // ── Empty: no todos at all ──────────────────────────────────────────────────
  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-7 w-7 text-violet-400" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-slate-200 mb-1">No todos yet</h2>
        <p className="text-sm text-slate-500 max-w-xs mb-6">
          Add a task to keep track of something you need to do.
        </p>
        <Link
          href="/todos/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-950/40 min-h-[44px]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Todo
        </Link>
      </div>
    )
  }

  // ── Empty active (completed exist) ─────────────────────────────────────────
  const activeSection =
    active.length > 0 ? (
      <section aria-labelledby="active-todos-heading">
        <div className="flex items-center gap-2 mb-3">
          <Circle className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
          <h2
            id="active-todos-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            To Do
            <span className="ml-2 text-slate-600 font-normal normal-case tracking-normal">
              ({active.length})
            </span>
          </h2>
        </div>
        <div className="space-y-2">
          {active.map((todo) => (
            <ActiveTodoCard key={todo.id} todo={todo} />
          ))}
        </div>
      </section>
    ) : (
      <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl">
        <CheckCircle2 className="h-8 w-8 text-violet-400 mb-2" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-300">You&apos;re all caught up!</p>
        <p className="text-xs text-slate-500 mt-0.5">No active todos right now.</p>
        <Link
          href="/todos/new"
          className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-semibold rounded-xl transition-all min-h-[36px]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add Todo
        </Link>
      </div>
    )

  const completedSection = completed.length > 0 && (
    <section aria-labelledby="completed-todos-heading">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
        <h2
          id="completed-todos-heading"
          className="text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          Completed
          <span className="ml-2 text-slate-600 font-normal normal-case tracking-normal">
            ({completed.length})
          </span>
        </h2>
      </div>
      <div className="space-y-2">
        {completed.map((todo) => (
          <CompletedTodoCard key={todo.id} todo={todo} />
        ))}
      </div>
    </section>
  )

  return (
    <div className="space-y-6">
      {activeSection}
      {completedSection}
    </div>
  )
}
