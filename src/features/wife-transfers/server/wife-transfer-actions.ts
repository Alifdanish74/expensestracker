'use server'

import { revalidatePath } from 'next/cache'
import {
  recordWifeTransferSchema,
  type RecordWifeTransferInput,
} from '../schemas/wife-transfer-schemas'
import {
  recordWifeTransferRecord,
  deleteWifeTransferRecord,
} from './wife-transfer-service'

export interface WifeTransferActionResponse {
  success: boolean
  message: string
}

/**
 * Server action to record a new funding transfer to wife.
 * Validates input, verifies source account ownership if provided, creates record, and revalidates cache.
 * Does NOT modify MonthlyPayment, Transaction, Commitment, or Account.currentBalance.
 */
export async function recordWifeTransferAction(
  input: RecordWifeTransferInput
): Promise<WifeTransferActionResponse> {
  try {
    const validated = recordWifeTransferSchema.parse(input)
    await recordWifeTransferRecord(validated)

    revalidatePath('/transfers/wife')

    return {
      success: true,
      message: 'Transfer to wife recorded successfully.',
    }
  } catch (err: unknown) {
    console.error('recordWifeTransferAction error:', err)
    const msg = err instanceof Error ? err.message : 'Unable to record transfer.'
    return {
      success: false,
      message: msg,
    }
  }
}

/**
 * Server action to delete an incorrectly recorded WifeTransfer entry.
 * Validates record ID and user ownership before deletion.
 */
export async function deleteWifeTransferAction(
  id: string
): Promise<WifeTransferActionResponse> {
  try {
    if (!id) {
      return { success: false, message: 'Invalid transfer ID.' }
    }
    await deleteWifeTransferRecord(id)

    revalidatePath('/transfers/wife')

    return {
      success: true,
      message: 'Transfer record deleted.',
    }
  } catch (err: unknown) {
    console.error('deleteWifeTransferAction error:', err)
    const msg = err instanceof Error ? err.message : 'Unable to delete transfer record.'
    return {
      success: false,
      message: msg,
    }
  }
}
