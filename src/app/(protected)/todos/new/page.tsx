import Link from 'next/link'
import { ArrowLeft, CheckSquare } from 'lucide-react'
import { TodoForm } from '@/features/todos/components/todo-form'
import { createTodoAction } from '@/features/todos/server/todo-actions'

export const metadata = {
  title: 'Add Todo — Expense Tracker',
  description: 'Add a new personal task to your todo list.',
}

export default function NewTodoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">
        {/* Back */}
        <Link
          href="/todos"
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm mb-6 min-h-[44px] -ml-1 px-1 w-fit"
          aria-label="Back to todos"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Todos
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
            <CheckSquare className="h-5 w-5 text-violet-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Add Todo</h1>
            <p className="text-sm text-slate-400 mt-0.5">Add a new task to your list.</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <TodoForm onSubmit={createTodoAction} mode="create" />
        </div>
      </div>
    </div>
  )
}
