'use server'

import { revalidatePath } from 'next/cache'
import {
  confirmPaymentAmountSchema,
  markPaidSchema,
  partialPaymentSchema,
} from '../schemas/payment-schemas'
import {
  confirmMonthlyPaymentAmount,
  markMonthlyPaymentPaid,
  addPartialPayment,
  skipMonthlyPayment,
  skipRemainingPayment,
} from './monthly-payment-service'

export interface PaymentMutationResponse {
  success: boolean
  message: string
}

/**
 * Server action to confirm a variable monthly payment amount.
 * Moves status from AMOUNT_REQUIRED to PENDING.
 */
export async function confirmPaymentAmountAction(
  paymentId: string,
  amount: string
): Promise<PaymentMutationResponse> {
  try {
    const validated = confirmPaymentAmountSchema.parse({ paymentId, amount })
    await confirmMonthlyPaymentAmount(validated.paymentId, validated.amount)

    revalidatePath('/payments')
    revalidatePath(`/payments/${paymentId}`)

    return {
      success: true,
      message: 'Monthly payment amount confirmed.',
    }
  } catch (err: unknown) {
    console.error('confirmPaymentAmountAction error:', err)
    const msg = err instanceof Error ? err.message : 'Unable to confirm payment amount.'
    return {
      success: false,
      message: msg,
    }
  }
}

/**
 * Server action to mark a pending payment as paid.
 * Moves status from PENDING to PAID.
 * If linked to an instalment, decrements remainingPayments atomically.
 */
export async function markPaidAction(
  paymentId: string,
  actualAmount: string,
  paidDate: string
): Promise<PaymentMutationResponse> {
  try {
    const validated = markPaidSchema.parse({ paymentId, actualAmount, paidDate })
    await markMonthlyPaymentPaid(validated.paymentId, validated.actualAmount, validated.paidDate)

    revalidatePath('/payments')
    revalidatePath(`/payments/${paymentId}`)
    revalidatePath('/installments')

    return {
      success: true,
      message: 'Payment marked as paid.',
    }
  } catch (err: unknown) {
    console.error('markPaidAction error:', err)
    const msg = err instanceof Error ? err.message : 'Unable to mark payment as paid.'
    return {
      success: false,
      message: msg,
    }
  }
}

/**
 * Server action to record an incremental partial or additional payment.
 * Increments actualAmount. Completes to PAID if total >= plannedAmount.
 * If linked to an instalment and completing to PAID, decrements remainingPayments atomically.
 */
export async function addPartialPaymentAction(
  paymentId: string,
  amount: string
): Promise<PaymentMutationResponse> {
  try {
    const validated = partialPaymentSchema.parse({ paymentId, amount })
    await addPartialPayment(validated.paymentId, validated.amount)

    revalidatePath('/payments')
    revalidatePath(`/payments/${paymentId}`)
    revalidatePath('/installments')

    return {
      success: true,
      message: 'Payment recorded successfully.',
    }
  } catch (err: unknown) {
    console.error('addPartialPaymentAction error:', err)
    const msg = err instanceof Error ? err.message : 'Unable to record partial payment.'
    return {
      success: false,
      message: msg,
    }
  }
}

/**
 * Server action to skip a payment for the current month.
 * Moves status from AMOUNT_REQUIRED or PENDING to SKIPPED.
 */
export async function skipPaymentAction(
  paymentId: string
): Promise<PaymentMutationResponse> {
  try {
    if (!paymentId) {
      return { success: false, message: 'Invalid payment ID.' }
    }
    await skipMonthlyPayment(paymentId)

    revalidatePath('/payments')
    revalidatePath(`/payments/${paymentId}`)
    revalidatePath('/installments')

    return {
      success: true,
      message: 'Payment skipped for this month.',
    }
  } catch (err: unknown) {
    console.error('skipPaymentAction error:', err)
    const msg = err instanceof Error ? err.message : 'Unable to skip payment.'
    return {
      success: false,
      message: msg,
    }
  }
}

/**
 * Server action to skip remaining obligation on a partially paid payment.
 * Moves status from PARTIALLY_PAID to SKIPPED while preserving recorded actualAmount.
 */
export async function skipRemainingAction(
  paymentId: string
): Promise<PaymentMutationResponse> {
  try {
    if (!paymentId) {
      return { success: false, message: 'Invalid payment ID.' }
    }
    await skipRemainingPayment(paymentId)

    revalidatePath('/payments')
    revalidatePath(`/payments/${paymentId}`)
    revalidatePath('/installments')

    return {
      success: true,
      message: 'Remaining payment obligation skipped.',
    }
  } catch (err: unknown) {
    console.error('skipRemainingAction error:', err)
    const msg = err instanceof Error ? err.message : 'Unable to skip remaining payment.'
    return {
      success: false,
      message: msg,
    }
  }
}
