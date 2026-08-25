'use server'

import { revalidatePath } from 'next/cache'
import { createRefundTransaction, updateRefundTransaction } from './transaction-service'
import type { RefundFormValues } from '../schemas/refund-schema'

export type RefundActionResult =
  | { success: true }
  | { success: false; error: string }

export async function createRefundAction(
  input: RefundFormValues
): Promise<RefundActionResult> {
  try {
    await createRefundTransaction(input)
    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    // Revalidate the original expense detail so refund total updates
    revalidatePath(`/transactions/${input.relatedTransactionId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to record refund. Please try again.'
    return { success: false, error: message }
  }
}

export async function updateRefundAction(
  transactionId: string,
  input: RefundFormValues
): Promise<RefundActionResult> {
  try {
    await updateRefundTransaction(transactionId, input)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to update refund. Please try again.'
    return { success: false, error: message }
  }
}
