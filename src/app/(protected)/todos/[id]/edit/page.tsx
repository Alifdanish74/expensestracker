import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getTodoById } from '@/features/todos/server/todo-service'
import { TodoForm } from '@/features/todos/components/todo-form'
import { updateTodoAction } from '@/features/todos/server/todo-actions'

interface EditTodoPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditTodoPageProps) {
  const { id } = await params
  const todo = await getTodoById(id)
  if (!todo) return { title: 'Todo Not Found — Expense Tracker' }
  return {
    title: `Edit Todo — ${todo.title}`,
    description: 'Edit this todo item.',
  }
}

export default async function EditTodoPage({ params }: EditTodoPageProps) {
  const { id } = await params
  const todo = await getTodoById(id)

  if (!todo) {
    notFound()
  }

  // Bind the ID into the action so the form doesn't need to expose it
  async function handleUpdate(values: Parameters<typeof updateTodoAction>[1]) {
    'use server'
    return updateTodoAction(id, values)
  }

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
            <Pencil className="h-5 w-5 text-violet-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Edit Todo</h1>
            <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{todo.title}</p>
          </div>
        </div>

        {/* Completed notice */}
        {todo.completed && (
          <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
            This todo is completed. Editing metadata will not reopen it.
          </div>
        )}

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <TodoForm
            onSubmit={handleUpdate}
            mode="edit"
            initialData={{
              title: todo.title,
              description: todo.description ?? '',
              dueDate: todo.dueDate ?? '',
            }}
          />
        </div>
      </div>
    </div>
  )
}
