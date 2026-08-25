'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createCommitment, updateCommitment, archiveCommitment } from './commitment-service'
import type { CommitmentFormValues } from '../schemas/commitment-schema'

export type CommitmentActionResult =
  | { success: true }
  | { success: false; error: string }

export async function createCommitmentAction(
  input: CommitmentFormValues
): Promise<CommitmentActionResult> {
  try {
    await createCommitment(input)
    revalidatePath('/commitments')
    return { success: true }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to create commitment. Please try again.'
    return { success: false, error: message }
  }
}

export async function updateCommitmentAction(
  id: string,
  input: CommitmentFormValues
): Promise<CommitmentActionResult> {
  try {
    await updateCommitment(id, input)
    revalidatePath('/commitments')
    revalidatePath(`/commitments/${id}`)
    return { success: true }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to update commitment. Please try again.'
    return { success: false, error: message }
  }
}

export async function archiveCommitmentAction(id: string): Promise<CommitmentActionResult> {
  try {
    await archiveCommitment(id)
    revalidatePath('/commitments')
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to archive commitment. Please try again.'
    return { success: false, error: message }
  }

  redirect('/commitments')
}
