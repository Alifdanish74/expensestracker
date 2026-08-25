/**
 * Calculates a UTC midnight Date for a commitment due date in a given year and month.
 * Automatically clamps the due day to the last valid day of the selected month
 * (e.g. 31st Feb 2026 -> 28th Feb 2026; 31st Feb 2028 -> 29th Feb 2028).
 *
 * Storing as midnight UTC prevents timezone shifts when the PostgreSQL @db.Date column
 * is read back.
 */
export function calculateDueDate(year: number, month: number, dueDay: number): Date {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const actualDueDay = Math.min(Math.max(1, dueDay), lastDay)
  return new Date(Date.UTC(year, month - 1, actualDueDay))
}
