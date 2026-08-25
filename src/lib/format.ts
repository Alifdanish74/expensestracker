/**
 * Formats a monetary amount as Malaysian Ringgit.
 * Example: formatCurrency(2823.69) => "RM2,823.69"
 */
export function formatCurrency(amount: unknown): string {
  let num = 0
  if (typeof amount === 'number') {
    num = amount
  } else if (typeof amount === 'string') {
    num = parseFloat(amount)
  } else if (amount && typeof amount === 'object' && 'toNumber' in amount) {
    num = (amount as { toNumber: () => number }).toNumber()
  } else if (amount != null) {
    num = parseFloat(String(amount))
  }
  if (isNaN(num)) return 'RM0.00'

  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Formats a day number with ordinal suffix.
 * Example: formatDay(1) => "1st", formatDay(12) => "12th"
 */
export function formatDay(day: number | null | undefined): string {
  if (day == null) return '—'
  const s = ['th', 'st', 'nd', 'rd']
  const v = day % 100
  return day + (s[(v - 20) % 10] || s[v] || s[0])
}
