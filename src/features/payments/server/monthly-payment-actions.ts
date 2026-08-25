'use server'

import { revalidatePath } from 'next/cache'
import { syncCommitmentsToMonthlyPayments } from './monthly-payment-service'
import { parseMonthParam } from '../utils/parse-month'

export interface ActionResponse {
  success: boolean
  message: string
  createdCount?: number
  skippedCount?: number
  totalApplicableCommitments?: number
}

/**
 * Prepares monthly payments for a specified month (YYYY-MM).
 * Idempotently generates monthly payment snapshots from active commitments and eligible instalments.
 */
export async function prepareMonthlyPaymentsAction(
  monthStr: string
): Promise<ActionResponse> {
  const parsed = parseMonthParam(monthStr)
  if (!parsed) {
    return { success: false, message: 'Invalid month format.' }
  }

  try {
    const result = await syncCommitmentsToMonthlyPayments(parsed.year, parsed.month)

    revalidatePath('/payments')
    revalidatePath('/installments')

    if (result.createdCount > 0) {
      return {
        success: true,
        message: `${result.createdCount} monthly payment${result.createdCount > 1 ? 's' : ''} prepared.`,
        ...result,
      }
    }

    return {
      success: true,
      message: 'Payments are already prepared.',
      ...result,
    }
  } catch (err) {
    console.error('Error preparing monthly payments:', err)
    return {
      success: false,
      message: 'Unable to prepare monthly payments.',
    }
  }
}

/**
 * Syncs recurring sources (commitments + instalments) for a month (YYYY-MM).
 * Creates missing monthly payment records for eligible sources
 * without modifying existing monthly payment snapshots.
 */
export async function syncCommitmentsAction(
  monthStr: string
): Promise<ActionResponse> {
  const parsed = parseMonthParam(monthStr)
  if (!parsed) {
    return { success: false, message: 'Invalid month format.' }
  }

  try {
    const result = await syncCommitmentsToMonthlyPayments(parsed.year, parsed.month)

    revalidatePath('/payments')
    revalidatePath('/installments')

    if (result.createdCount > 0) {
      return {
        success: true,
        message: `${result.createdCount} new payment${result.createdCount > 1 ? 's' : ''} added.`,
        ...result,
      }
    }

    return {
      success: true,
      message: 'Payments are already up to date.',
      ...result,
    }
  } catch (err) {
    console.error('Error syncing payments:', err)
    return {
      success: false,
      message: 'Unable to sync payments.',
    }
  }
}
