'use server'

import { revalidatePath } from 'next/cache'
import { createTransferTransaction, updateTransferTransaction } from './transaction-service'
import type { TransferFormValues } from '../schemas/transfer-schema'

export type TransferActionResult =
  | { success: true }
  | { success: false; error: string }

export async function createTransferAction(
  input: TransferFormValues
): Promise<TransferActionResult> {
  try {
    await createTransferTransaction(input)
    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to record transfer. Please try again.'
    return { success: false, error: message }
  }
}

export async function updateTransferAction(
  transactionId: string,
  input: TransferFormValues
): Promise<TransferActionResult> {
  try {
    await updateTransferTransaction(transactionId, input)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to update transfer. Please try again.'
    return { success: false, error: message }
  }
}
