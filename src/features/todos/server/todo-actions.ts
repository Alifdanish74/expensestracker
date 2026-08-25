'use server'

import { redirect } from 'next/navigation'
import { createTodo, updateTodo, deleteTodo, setTodoCompleted } from './todo-service'
import type { TodoFormValues } from '../schemas/todo-schema'

export type TodoActionResult =
  | { success: true }
  | { success: false; error: string }

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Creates a new Todo and redirects to /todos.
 * Called from the Add Todo form.
 */
export async function createTodoAction(input: TodoFormValues): Promise<TodoActionResult> {
  try {
    await createTodo(input)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to add todo. Please try again.'
    return { success: false, error: message }
  }
  redirect('/todos')
}

// ── Update ────────────────────────────────────────────────────────────────────

/**
 * Updates an existing Todo's editable fields and redirects to /todos.
 * Preserves completion state.
 */
export async function updateTodoAction(
  id: string,
  input: TodoFormValues
): Promise<TodoActionResult> {
  try {
    await updateTodo(id, input)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to update todo. Please try again.'
    return { success: false, error: message }
  }
  redirect('/todos')
}

// ── Complete / Reopen ─────────────────────────────────────────────────────────

/**
 * Sets a Todo's completion state to the given target.
 * Uses target-state semantics (not blind toggle) — idempotent on repeated calls.
 */
export async function setTodoCompletedAction(
  id: string,
  targetCompleted: boolean
): Promise<TodoActionResult> {
  try {
    await setTodoCompleted(id, targetCompleted)
    return { success: true }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to update todo status. Please try again.'
    return { success: false, error: message }
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Deletes a Todo after server-side ownership verification.
 * Hard delete — no archive.
 */
export async function deleteTodoAction(id: string): Promise<TodoActionResult> {
  try {
    await deleteTodo(id)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to delete todo. Please try again.'
    return { success: false, error: message }
  }
}
