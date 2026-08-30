'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import {
  CheckSquare,
  X,
  Plus,
  Check,
  Trash2,
  Calendar,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TodoItem, TodosResult } from '../server/todo-service'
import {
  getTodosAction,
  createTodoModalAction,
  setTodoCompletedAction,
  deleteTodoAction,
} from '../server/todo-actions'
import {
  getDueStatus,
  formatDueDate,
  formatCompletedAt,
  type TodoDueStatus,
} from '../utils/todo-date-utils'

interface TodoFloatingWidgetProps {
  initialTodos?: TodosResult
}

type TabType = 'pending' | 'completed' | 'all'

const STATUS_CLASSES: Record<TodoDueStatus, string> = {
  OVERDUE: 'bg-red-500/15 border-red-500/40 text-red-300',
  DUE_TODAY: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
  UPCOMING: 'bg-slate-800 border-slate-700 text-slate-400',
  NO_DATE: 'bg-slate-800/40 border-slate-800 text-slate-500',
}

export function TodoFloatingWidget({ initialTodos }: TodoFloatingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [todos, setTodos] = useState<TodosResult>(
    initialTodos ?? { active: [], completed: [] }
  )

  // Form State
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingTodoId, setLoadingTodoId] = useState<string | null>(null)

  // Refresh tasks when modal opens
  const refreshTodos = useCallback(async () => {
    const res = await getTodosAction()
    if (res.success) {
      setTodos(res.data)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      refreshTodos()
    }
  }, [isOpen, refreshTodos])

  // ESC key listener to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Quick Add submit
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setFormError(null)
    setIsSubmitting(true)

    try {
      const res = await createTodoModalAction({
        title: title.trim(),
        description: '',
        dueDate: dueDate || '',
      })

      if (!res.success) {
        setFormError(res.error)
        return
      }

      setTitle('')
      setDueDate('')
      setShowDatePicker(false)
      await refreshTodos()
    } catch {
      setFormError('Failed to save task. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle completed / pending
  const handleToggleComplete = async (todo: TodoItem) => {
    setLoadingTodoId(todo.id)
    const newTarget = !todo.completed

    // Optimistic UI update
    setTodos((prev) => {
      if (newTarget) {
        const itemToComplete = prev.active.find((t) => t.id === todo.id)
        if (!itemToComplete) return prev
        const updated = { ...itemToComplete, completed: true, completedAt: new Date() }
        return {
          active: prev.active.filter((t) => t.id !== todo.id),
          completed: [updated, ...prev.completed],
        }
      } else {
        const itemToReopen = prev.completed.find((t) => t.id === todo.id)
        if (!itemToReopen) return prev
        const updated = { ...itemToReopen, completed: false, completedAt: null }
        return {
          active: [updated, ...prev.active],
          completed: prev.completed.filter((t) => t.id !== todo.id),
        }
      }
    })

    startTransition(async () => {
      await setTodoCompletedAction(todo.id, newTarget)
      await refreshTodos()
      setLoadingTodoId(null)
    })
  }

  // Delete Todo
  const handleDelete = async (id: string) => {
    setLoadingTodoId(id)

    // Optimistic remove
    setTodos((prev) => ({
      active: prev.active.filter((t) => t.id !== id),
      completed: prev.completed.filter((t) => t.id !== id),
    }))

    startTransition(async () => {
      await deleteTodoAction(id)
      await refreshTodos()
      setLoadingTodoId(null)
    })
  }

  const activeCount = todos.active.length
  const completedCount = todos.completed.length
  const totalCount = activeCount + completedCount

  const displayList =
    activeTab === 'pending'
      ? todos.active
      : activeTab === 'completed'
      ? todos.completed
      : [...todos.active, ...todos.completed]

  return (
    <>
      {/* ── Floating Action Button (FAB) ── */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={`Open To-Do List (${activeCount} pending tasks)`}
          className="group relative flex items-center justify-center w-13 h-13 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 text-white shadow-xl shadow-purple-950/60 ring-2 ring-purple-400/30 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
        >
          <CheckSquare className="h-6 w-6 transition-transform group-hover:rotate-6" />

          {/* Active Badge Counter */}
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-rose-500 text-white text-[11px] font-bold shadow-md shadow-rose-950/50 animate-in zoom-in">
              {activeCount > 99 ? '99+' : activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Bottom-Up Sheet Modal ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
          role="dialog"
          aria-modal="true"
          aria-label="To-Do List Modal"
        >
          <div className="max-w-lg mx-auto w-full max-h-[85vh] bg-slate-900 border-t border-x border-slate-800 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Pull Bar Handle */}
            <div className="pt-3 pb-1 flex justify-center flex-shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-slate-700/80 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-800/80 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <CheckSquare className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    To-Do List
                    {activeCount > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {activeCount} pending
                      </span>
                    )}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Add Form */}
            <div className="p-4 bg-slate-950/50 border-b border-slate-800/80 flex-shrink-0 space-y-2">
              <form onSubmit={handleAddTodo} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Type a new task..."
                    disabled={isSubmitting}
                    className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all"
                  />

                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    title="Set Due Date"
                    className={cn(
                      'p-2.5 rounded-xl border transition-all text-xs font-semibold flex items-center justify-center min-w-[42px] min-h-[42px]',
                      dueDate || showDatePicker
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    )}
                  >
                    <Calendar className="h-4 w-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !title.trim()}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-purple-950/40 disabled:opacity-50 flex items-center gap-1.5 min-h-[42px]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add
                      </>
                    )}
                  </button>
                </div>

                {/* Optional Date Picker input strip */}
                {showDatePicker && (
                  <div className="flex items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
                    <label className="text-xs font-medium text-slate-400">Due Date:</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => setDueDate('')}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Clear Date
                      </button>
                    )}
                  </div>
                )}

                {formError && (
                  <p className="text-xs text-rose-400 font-medium px-1">{formError}</p>
                )}
              </form>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800/60 flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  activeTab === 'pending'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}
              >
                Pending
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  activeTab === 'completed'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}
              >
                Completed
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
                  {completedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  activeTab === 'all'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}
              >
                All ({totalCount})
              </button>
            </div>

            {/* Task List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {displayList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Sparkles className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-400">
                    {activeTab === 'pending'
                      ? 'No pending tasks!'
                      : activeTab === 'completed'
                      ? 'No completed tasks yet.'
                      : 'No tasks found.'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activeTab === 'pending'
                      ? 'Add a task above to keep track of your reminders.'
                      : 'Completed tasks will appear here.'}
                  </p>
                </div>
              ) : (
                displayList.map((todo) => {
                  const status = getDueStatus(todo.dueDate)
                  const formattedDate = formatDueDate(todo.dueDate)
                  const completedText = formatCompletedAt(todo.completedAt)
                  const isLoadingThis = loadingTodoId === todo.id

                  return (
                    <div
                      key={todo.id}
                      className={cn(
                        'group bg-slate-950/60 border rounded-2xl p-3.5 transition-all flex items-start gap-3',
                        todo.completed
                          ? 'border-slate-800/60 opacity-70'
                          : status === 'OVERDUE'
                          ? 'border-red-500/30 bg-red-950/10'
                          : 'border-slate-800 hover:border-slate-700'
                      )}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(todo)}
                        disabled={isLoadingThis || isPending}
                        className={cn(
                          'flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all min-w-[24px]',
                          todo.completed
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : 'border-slate-600 hover:border-purple-400 hover:bg-purple-400/10'
                        )}
                        aria-label={
                          todo.completed ? 'Mark pending' : 'Mark completed'
                        }
                      >
                        {isLoadingThis ? (
                          <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                        ) : todo.completed ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : null}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p
                          className={cn(
                            'text-sm font-semibold leading-snug break-words',
                            todo.completed
                              ? 'text-slate-500 line-through'
                              : 'text-slate-100'
                          )}
                        >
                          {todo.title}
                        </p>

                        {/* Badges & Dates */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {!todo.completed && status === 'OVERDUE' && (
                            <span className="px-2 py-0.5 rounded-full font-semibold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Overdue
                            </span>
                          )}

                          {!todo.completed && status === 'DUE_TODAY' && (
                            <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Due Today
                            </span>
                          )}

                          {formattedDate && !todo.completed && (
                            <span className="text-slate-400">Due {formattedDate}</span>
                          )}

                          {todo.completed && completedText && (
                            <span className="text-slate-500">
                              Done {completedText}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete Action */}
                      <button
                        type="button"
                        onClick={() => handleDelete(todo.id)}
                        disabled={isLoadingThis || isPending}
                        aria-label={`Delete task: ${todo.title}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 transition-all min-h-[32px] min-w-[32px] flex items-center justify-center flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
