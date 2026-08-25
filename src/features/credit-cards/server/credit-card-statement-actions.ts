'use server'

import { revalidatePath } from 'next/cache'
import {
  createCreditCardStatement,
  updateCreditCardStatement,
  deleteCreditCardStatement,
} from './credit-card-statement-service'
import type { CreditCardStatementInput } from '../schemas/credit-card-statement-schema'

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

export async function createCreditCardStatementAction(
  accountId: string,
  input: CreditCardStatementInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const statement = await createCreditCardStatement(accountId, input)
    revalidatePath('/credit-cards')
    revalidatePath(`/credit-cards/${accountId}`)
    return { success: true, data: { id: statement.id } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to create statement'
    return { success: false, error: message }
  }
}

export async function updateCreditCardStatementAction(
  accountId: string,
  statementId: string,
  input: CreditCardStatementInput
): Promise<ActionResult> {
  try {
    await updateCreditCardStatement(accountId, statementId, input)
    revalidatePath('/credit-cards')
    revalidatePath(`/credit-cards/${accountId}`)
    revalidatePath(`/credit-cards/${accountId}/statements/${statementId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to update statement'
    return { success: false, error: message }
  }
}

export async function deleteCreditCardStatementAction(
  accountId: string,
  statementId: string
): Promise<ActionResult> {
  try {
    await deleteCreditCardStatement(accountId, statementId)
    revalidatePath('/credit-cards')
    revalidatePath(`/credit-cards/${accountId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to delete statement'
    return { success: false, error: message }
  }
}
