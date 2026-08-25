/**
 * Pure utility for computing instalment progress display data.
 *
 * completedPayments is derived, never stored.
 * totalPayments is optional — if null/undefined, only remaining count is shown.
 */

export type InstallmentProgressResult =
  | { hasTotal: false; remaining: number }
  | {
      hasTotal: true
      total: number
      remaining: number
      completed: number
      /** Clamped to 0–100 */
      percentage: number
    }

export function computeInstallmentProgress(
  totalPayments: number | null | undefined,
  remainingPayments: number
): InstallmentProgressResult {
  if (totalPayments == null) {
    return { hasTotal: false, remaining: remainingPayments }
  }

  const completed = Math.max(0, totalPayments - remainingPayments)
  const percentage = totalPayments > 0
    ? Math.min(100, Math.max(0, (completed / totalPayments) * 100))
    : 0

  return {
    hasTotal: true,
    total: totalPayments,
    remaining: remainingPayments,
    completed,
    percentage,
  }
}
