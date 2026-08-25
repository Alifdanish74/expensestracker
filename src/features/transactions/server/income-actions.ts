'use server'

import { revalidatePath } from 'next/cache'
import { createIncomeTransaction, updateIncomeTransaction } from './transaction-service'
import type { IncomeFormValues } from '../schemas/income-schema'

export type IncomeActionResult =
  | { success: true }
  | { success: false; error: string }

export async function createIncomeAction(
  input: IncomeFormValues
): Promise<IncomeActionResult> {
  try {
    await createIncomeTransaction(input)
    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to record income. Please try again.'
    return { success: false, error: message }
  }
}

export async function updateIncomeAction(
  transactionId: string,
  input: IncomeFormValues
): Promise<IncomeActionResult> {
  try {
    await updateIncomeTransaction(transactionId, input)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to update income. Please try again.'
    return { success: false, error: message }
  }
}
