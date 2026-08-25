'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  createExpense,
  updateExpense,
  deleteTransaction,
} from './transaction-service'
import type { ExpenseFormValues } from '../schemas/expense-schema'

export type ExpenseActionResult =
  | { success: true }
  | { success: false; error: string }

// ── Create ────────────────────────────────────────────────────────────────────

export async function createExpenseAction(
  input: ExpenseFormValues
): Promise<ExpenseActionResult> {
  try {
    await createExpense(input)
    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to save expense. Please try again.'
    return { success: false, error: message }
  }
}

/** Called after server-side redirect to transactions. */
export async function createExpenseAndRedirect(input: ExpenseFormValues): Promise<void> {
  await createExpense(input)
  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  redirect('/transactions')
}

// ── Update ────────────────────────────────────────────────────────────────────

/**
 * Updates an EXPENSE transaction. Validates input, verifies ownership of
 * transaction/account/category, enforces refund amount guard, then persists and revalidates cache.
 */
export async function updateExpenseAction(
  transactionId: string,
  input: ExpenseFormValues
): Promise<ExpenseActionResult> {
  try {
    await updateExpense(transactionId, input)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to update expense. Please try again.'
    return { success: false, error: message }
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Deletes a transaction after verifying ownership.
 * EXPENSE deletion is blocked if linked refunds exist.
 * Revalidation happens inside the service function.
 */
export async function deleteExpenseAction(
  transactionId: string
): Promise<ExpenseActionResult> {
  try {
    await deleteTransaction(transactionId)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to delete expense. Please try again.'
    return { success: false, error: message }
  }
}
