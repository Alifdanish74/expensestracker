'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthNavProps {
  year: number
  month: number
  /** Other search params to preserve when navigating (e.g. q, account, category) */
  extraParams?: Record<string, string>
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toMonthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function MonthNav({ year, month, extraParams = {} }: MonthNavProps) {
  const router = useRouter()

  function navigateTo(y: number, m: number) {
    const params = new URLSearchParams({ ...extraParams, month: toMonthParam(y, m) })
    router.push(`/transactions?${params.toString()}`)
  }

  function prevMonth() {
    if (month === 1) navigateTo(year - 1, 12)
    else navigateTo(year, month - 1)
  }

  function nextMonth() {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    // Don't navigate past current month
    if (year === currentYear && month === currentMonth) return
    if (month === 12) navigateTo(year + 1, 1)
    else navigateTo(year, month + 1)
  }

  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={prevMonth}
        aria-label="Previous month"
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="text-sm font-semibold text-slate-200 min-w-[120px] text-center">
        {MONTHS[month - 1]} {year}
      </span>

      <button
        type="button"
        onClick={nextMonth}
        disabled={isCurrentMonth}
        aria-label="Next month"
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
