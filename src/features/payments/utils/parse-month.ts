/**
 * Parses a "YYYY-MM" string into { year, month } numbers.
 * Returns null if the string is invalid or out of range.
 */
export function parseMonthParam(monthStr: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr)
  if (!match) return null
  const year = parseInt(match[1]!, 10)
  const month = parseInt(match[2]!, 10)
  if (year < 2000 || year > 2100) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}
