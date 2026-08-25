'use client'

import { useState, useTransition } from 'react'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { deleteTodoAction } from '../server/todo-actions'

interface DeleteTodoDialogProps {
  todoId: string
  todoTitle: string
}

export function DeleteTodoDialog({ todoId, todoTitle }: DeleteTodoDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
        aria-label={`Delete todo: ${todoTitle}`}
        title="Delete"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <DeleteConfirmDialog
          todoId={todoId}
          todoTitle={todoTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function DeleteConfirmDialog({
  todoId,
  todoTitle,
  onClose,
}: DeleteTodoDialogProps & { onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteTodoAction(todoId)
      if (!result.success) {
        setError(result.error)
        return
      }
      onClose()
      // revalidatePath in the action refreshes the list automatically
    })
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !isPending) onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-todo-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
        {/* Icon + title */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div>
            <h2 id="delete-todo-title" className="text-base font-semibold text-slate-100">
              Delete todo?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">This todo will be permanently removed.</p>
          </div>
        </div>

        {/* Task preview */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-slate-100 line-clamp-2">{todoTitle}</p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2" role="alert">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            autoFocus
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all text-sm min-h-[44px] border border-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-xl transition-all text-sm min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isPending ? (
              <><Loader2 className="animate-spin h-4 w-4" aria-hidden="true" />Deleting…</>
            ) : (
              <><Trash2 className="h-4 w-4" aria-hidden="true" />Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
