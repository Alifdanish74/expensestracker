import type { AccountType } from '@/generated/prisma/client'

/** Maps AccountType enum values to user-friendly labels. */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  BANK_ACCOUNT: 'Bank Account',
  CREDIT_CARD: 'Credit Card',
  E_WALLET: 'E-Wallet',
  CASH: 'Cash',
  FINANCING: 'Financing',
}

/** Returns a human-readable account type label. */
export function formatAccountType(type: AccountType): string {
  return ACCOUNT_TYPE_LABELS[type] ?? type
}

/** Ordered list of account type options for form selects. */
export const ACCOUNT_TYPE_OPTIONS = (
  Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]
).map(([value, label]) => ({ value, label }))

/** Account types that have credit-card-specific fields. */
export const CREDIT_CARD_TYPES: AccountType[] = ['CREDIT_CARD']

/** Account types that have a due day field. */
export const HAS_DUE_DAY_TYPES: AccountType[] = ['CREDIT_CARD', 'FINANCING']

/** Account types that typically have an institution name. */
export const HAS_INSTITUTION_TYPES: AccountType[] = [
  'BANK_ACCOUNT',
  'CREDIT_CARD',
  'E_WALLET',
  'FINANCING',
]
