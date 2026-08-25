'use server'

import { revalidatePath } from 'next/cache'
import { createCardPaymentTransaction, updateCardPaymentTransaction } from './transaction-service'
import type { CardPaymentFormValues } from '../schemas/card-payment-schema'

export type CardPaymentActionResult =
  | { success: true }
  | { success: false; error: string }

export async function createCardPaymentAction(
  input: CardPaymentFormValues
): Promise<CardPaymentActionResult> {
  try {
    await createCardPaymentTransaction(input)
    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/credit-cards')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to record card payment. Please try again.'
    return { success: false, error: message }
  }
}

export async function updateCardPaymentAction(
  transactionId: string,
  input: CardPaymentFormValues
): Promise<CardPaymentActionResult> {
  try {
    await updateCardPaymentTransaction(transactionId, input)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to update card payment. Please try again.'
    return { success: false, error: message }
  }
}
