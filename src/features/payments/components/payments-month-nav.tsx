'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaymentsMonthNavProps {
  year: number
  month: number
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function toMonthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function PaymentsMonthNav({ year, month }: PaymentsMonthNavProps) {
  const router = useRouter()

  function navigateTo(y: number, m: number) {
    const params = new URLSearchParams({ month: toMonthParam(y, m) })
    router.push(`/payments?${params.toString()}`)
  }

  function prevMonth() {
    if (month === 1) navigateTo(year - 1, 12)
    else navigateTo(year, month - 1)
  }

  function nextMonth() {
    if (month === 12) navigateTo(year + 1, 1)
    else navigateTo(year, month + 1)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={prevMonth}
        aria-label="Previous month"
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all cursor-pointer min-h-[44px] min-w-[44px]"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="text-sm font-semibold text-slate-200 min-w-[120px] text-center">
        {MONTHS[month - 1]} {year}
      </span>

      <button
        type="button"
        onClick={nextMonth}
        aria-label="Next month"
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all cursor-pointer min-h-[44px] min-w-[44px]"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
