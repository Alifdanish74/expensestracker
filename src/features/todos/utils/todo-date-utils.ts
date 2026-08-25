/**
 * Todo date utilities.
 *
 * Due dates are calendar-date-only values stored as midnight UTC in the DB.
 * Overdue detection compares calendar dates locally, not raw timestamps.
 *
 * Rule:
 *   completed = false AND dueDate < today → OVERDUE
 *   completed = false AND dueDate = today → DUE_TODAY
 *   completed = false AND dueDate > today → UPCOMING
 *   completed = false AND dueDate = null  → NO_DATE
 *   completed = true                       → COMPLETED (no overdue flag)
 */

export type TodoDueStatus = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | 'NO_DATE'

/**
 * Returns today's local calendar date as a YYYY-MM-DD string.
 * Uses the device/server locale so overdue comparisons are not UTC-shifted.
 */
export function getTodayLocalDateString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Derives the due status for an active (not completed) Todo.
 * dueDateStr must be a YYYY-MM-DD string from the database (via toISOString().slice(0,10)).
 * Returns NO_DATE if dueDateStr is null/undefined.
 */
export function getDueStatus(dueDateStr: string | null | undefined): TodoDueStatus {
  if (!dueDateStr) return 'NO_DATE'
  const today = getTodayLocalDateString()
  if (dueDateStr < today) return 'OVERDUE'
  if (dueDateStr === today) return 'DUE_TODAY'
  return 'UPCOMING'
}

/**
 * Formats a YYYY-MM-DD string into a human-readable date (e.g. "30 Aug 2026").
 * Parses as UTC midnight to avoid single-day shifts.
 */
export function formatDueDate(dueDateStr: string | null | undefined): string | null {
  if (!dueDateStr) return null
  const [year, month, day] = dueDateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year!, month! - 1, day!))
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Formats a completedAt timestamp into a readable completion date string.
 */
export function formatCompletedAt(completedAt: Date | string | null | undefined): string | null {
  if (!completedAt) return null
  const d = typeof completedAt === 'string' ? new Date(completedAt) : completedAt
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
