'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAccount, updateAccount, archiveAccount } from './account-service'
import type { AccountFormValues } from '../schemas/account-schema'

export type ActionResult =
  | { success: true }
  | { success: false; error: string }

export async function createAccountAction(
  input: AccountFormValues
): Promise<ActionResult> {
  try {
    await createAccount(input)
    revalidatePath('/accounts')
    // Return success; client will redirect
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to create account'
    return { success: false, error: message }
  }
}

export async function updateAccountAction(
  id: string,
  input: AccountFormValues
): Promise<ActionResult> {
  try {
    await updateAccount(id, input)
    revalidatePath('/accounts')
    revalidatePath(`/accounts/${id}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to update account'
    return { success: false, error: message }
  }
}

export async function archiveAccountAction(id: string): Promise<void> {
  await archiveAccount(id)
  revalidatePath('/accounts')
  redirect('/accounts')
}
