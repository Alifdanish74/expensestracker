import type { CreditCardBalanceState, StatementBalanceState } from '../types/credit-card-types'

/**
 * Converts a Decimal, number, or string value into a clean float number.
 */
function toNumber(val: unknown): number {
  if (val == null) return 0
  if (typeof val === 'number') return val
  if (typeof val === 'string') return parseFloat(val) || 0
  if (typeof val === 'object' && val !== null && 'toNumber' in val) {
    return (val as { toNumber: () => number }).toNumber()
  }
  return parseFloat(String(val)) || 0
}

/**
 * Evaluates formal credit card balance semantics.
 * - currentBalance > 0 -> Outstanding Balance (amount currently owed to card provider)
 * - currentBalance = 0 -> No Outstanding Balance
 * - currentBalance < 0 -> Credit Balance (card has overpaid / credit balance)
 * Note: Raw sign in DB remains negative for overpaid balance; UI transforms display amount to abs(currentBalance).
 */
export function getCreditCardBalanceState(currentBalance: unknown): CreditCardBalanceState {
  const raw = toNumber(currentBalance)

  if (raw > 0) {
    return {
      type: 'outstanding',
      label: 'Outstanding Balance',
      rawBalance: raw,
      displayAmount: Math.abs(raw),
    }
  }

  if (raw < 0) {
    return {
      type: 'credit',
      label: 'Credit Balance',
      secondaryBadge: 'Overpaid',
      rawBalance: raw,
      displayAmount: Math.abs(raw),
    }
  }

  return {
    type: 'clear',
    label: 'No Outstanding Balance',
    rawBalance: 0,
    displayAmount: 0,
  }
}

/**
 * Evaluates formal statement balance semantics.
 * - statementBalance > 0 -> Statement Balance
 * - statementBalance = 0 -> Statement Balance (RM0.00)
 * - statementBalance < 0 -> Statement Credit
 */
export function getStatementBalanceState(statementBalance: unknown): StatementBalanceState {
  const raw = toNumber(statementBalance)

  if (raw > 0) {
    return {
      type: 'outstanding',
      label: 'Statement Balance',
      rawBalance: raw,
      displayAmount: Math.abs(raw),
    }
  }

  if (raw < 0) {
    return {
      type: 'credit',
      label: 'Statement Credit',
      secondaryBadge: 'Credit',
      rawBalance: raw,
      displayAmount: Math.abs(raw),
    }
  }

  return {
    type: 'clear',
    label: 'Statement Balance',
    rawBalance: 0,
    displayAmount: 0,
  }
}

/**
 * Calculates credit utilisation percentage using positive outstanding debt only.
 * Formula: max(currentBalance, 0) / creditLimit * 100
 * - Returns null if creditLimit is null or <= 0.
 * - Returns 0% for zero or negative (overpaid) currentBalance.
 * - Does NOT clamp percentage display text (e.g. 110% stays 110%).
 */
export function calculateCreditUtilisation(
  currentBalance: unknown,
  creditLimit: unknown
): number | null {
  if (creditLimit == null) return null

  const limitNum = toNumber(creditLimit)
  if (limitNum <= 0) return null

  const balanceNum = toNumber(currentBalance)
  const utilisedAmount = Math.max(balanceNum, 0)

  return (utilisedAmount / limitNum) * 100
}

/**
 * Calculates estimated available credit based on tracked balance.
 * Formula: creditLimit - currentBalance
 * Examples:
 * - limit: 8000, balance: 3250.40 -> 4749.60
 * - limit: 10000, balance: -350 -> 10350.00 (credit balance expands available limit)
 * Returns null if creditLimit is missing/null.
 */
export function calculateEstimatedAvailableCredit(
  currentBalance: unknown,
  creditLimit: unknown
): number | null {
  if (creditLimit == null) return null

  const limitNum = toNumber(creditLimit)
  const balanceNum = toNumber(currentBalance)

  return limitNum - balanceNum
}
