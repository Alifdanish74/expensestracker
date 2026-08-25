'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  createInstallment,
  updateInstallment,
  archiveInstallment,
} from './installment-service'
import type { InstallmentFormValues } from '../schemas/installment-schema'

export type InstallmentActionResult =
  | { success: true }
  | { success: false; error: string }

export async function createInstallmentAction(
  input: InstallmentFormValues
): Promise<InstallmentActionResult> {
  try {
    await createInstallment(input)
    revalidatePath('/installments')
    return { success: true }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to create instalment. Please try again.'
    return { success: false, error: message }
  }
}

export async function updateInstallmentAction(
  id: string,
  input: InstallmentFormValues
): Promise<InstallmentActionResult> {
  try {
    await updateInstallment(id, input)
    revalidatePath('/installments')
    revalidatePath(`/installments/${id}`)
    return { success: true }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to update instalment. Please try again.'
    return { success: false, error: message }
  }
}

export async function archiveInstallmentAction(id: string): Promise<InstallmentActionResult> {
  try {
    await archiveInstallment(id)
    revalidatePath('/installments')
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to archive instalment. Please try again.'
    return { success: false, error: message }
  }

  redirect('/installments')
}
