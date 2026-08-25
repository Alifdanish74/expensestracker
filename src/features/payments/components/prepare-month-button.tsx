'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { prepareMonthlyPaymentsAction } from '../server/monthly-payment-actions'

interface PrepareMonthButtonProps {
  monthStr: string
  monthLabel: string
}

export function PrepareMonthButton({ monthStr, monthLabel }: PrepareMonthButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  function handlePrepare() {
    setFeedback(null)
    setIsError(false)

    startTransition(async () => {
      const res = await prepareMonthlyPaymentsAction(monthStr)
      if (!res.success) {
        setIsError(true)
        setFeedback(res.message)
      } else {
        setFeedback(res.message)
      }
    })
  }

  return (
    <div className="space-y-3 text-center">
      <button
        id="prepare-month-btn"
        type="button"
        disabled={isPending}
        onClick={handlePrepare}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-70 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/30 cursor-pointer min-h-[48px]"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Preparing...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Prepare {monthLabel} Payments</span>
          </>
        )}
      </button>

      {feedback && (
        <p
          className={`text-xs ${
            isError ? 'text-rose-400 font-semibold' : 'text-slate-400 font-medium'
          }`}
        >
          {feedback}
        </p>
      )}
    </div>
  )
}
