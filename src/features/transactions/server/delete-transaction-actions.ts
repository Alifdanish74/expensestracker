'use server'

import { deleteTransaction } from './transaction-service'

export type DeleteTransactionResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Generalised delete server action for any transaction type.
 * Verifies ownership and type-specific guards (e.g. EXPENSE with active refunds).
 * Revalidation is handled inside the service function.
 */
export async function deleteTransactionAction(
  transactionId: string
): Promise<DeleteTransactionResult> {
  try {
    await deleteTransaction(transactionId)
    return { success: true }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to delete transaction. Please try again.'
    return { success: false, error: message }
  }
}
