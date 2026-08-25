// ── Transaction type label utilities ─────────────────────────────────────────

/**
 * Returns a human-readable label for a TransactionType enum value.
 * Falls back to the raw value if unknown (future-proofing).
 */
export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    EXPENSE: 'Expense',
    INCOME: 'Income',
    TRANSFER: 'Transfer',
    CARD_PAYMENT: 'Card Payment',
    REFUND: 'Refund',
    ADJUSTMENT: 'Adjustment',
  }
  return labels[type] ?? type
}

/**
 * Returns a Tailwind CSS colour class pair (text + bg) for badge display.
 * Designed for the slate-950 dark background used throughout the app.
 */
export function getTransactionTypeBadgeClass(type: string): string {
  const classes: Record<string, string> = {
    EXPENSE: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    INCOME: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    TRANSFER: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    CARD_PAYMENT: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
    REFUND: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
    ADJUSTMENT: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  }
  return classes[type] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/20'
}

/**
 * Returns the text colour class for the amount display.
 *   EXPENSE        → rose (negative spending)
 *   INCOME         → emerald (positive inflow)
 *   REFUND         → teal/emerald (reduces spending)
 *   TRANSFER       → blue (neutral movement)
 *   CARD_PAYMENT   → indigo (debt settlement)
 *   ADJUSTMENT     → amber
 */
export function getAmountColourClass(type: string): string {
  const colours: Record<string, string> = {
    EXPENSE: 'text-rose-400',
    INCOME: 'text-emerald-400',
    REFUND: 'text-teal-400',
    TRANSFER: 'text-blue-400',
    CARD_PAYMENT: 'text-indigo-400',
    ADJUSTMENT: 'text-amber-400',
  }
  return colours[type] ?? 'text-slate-300'
}

/**
 * Returns the display amount string for UI rendering.
 *   EXPENSE        → "-RM120.00"
 *   INCOME/REFUND  → "+RM80.00"
 *   TRANSFER/CARD_PAYMENT/ADJUSTMENT → "RM200.00" (direction shown by account labels)
 */
export function formatDisplayAmount(type: string, formattedAmount: string): string {
  if (type === 'EXPENSE') return `-${formattedAmount}`
  if (type === 'INCOME' || type === 'REFUND') return `+${formattedAmount}`
  return formattedAmount
}

/**
 * True if the type contributes to actual spending / refund calculations.
 * EXPENSE and REFUND are the only types included in net spending.
 */
export function isSpendingType(type: string): boolean {
  return type === 'EXPENSE' || type === 'REFUND'
}

/**
 * True if the type represents a fund movement between two own accounts.
 * TRANSFER and CARD_PAYMENT are excluded from spending calculations.
 */
export function isMovementType(type: string): boolean {
  return type === 'TRANSFER' || type === 'CARD_PAYMENT'
}
