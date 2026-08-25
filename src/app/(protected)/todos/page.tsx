import Link from 'next/link'
import { Plus, CheckSquare } from 'lucide-react'
import { getTodos } from '@/features/todos/server/todo-service'
import { TodoList } from '@/features/todos/components/todo-list'

export const metadata = {
  title: 'Todos — Expense Tracker',
  description: 'Keep track of personal tasks and things you need to do.',
}

export default async function TodosPage() {
  const todos = await getTodos()

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <CheckSquare className="h-4.5 w-4.5 text-violet-400" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Todos</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Keep track of personal tasks.
              </p>
            </div>
          </div>
          <Link
            href="/todos/new"
            id="todos-add-btn"
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-950/40 min-h-[40px]"
            aria-label="Add a new todo"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Add Todo</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </header>

        {/* Todo list */}
        <TodoList todos={todos} />
      </div>
    </div>
  )
}
