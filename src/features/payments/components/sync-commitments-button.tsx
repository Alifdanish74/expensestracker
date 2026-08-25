'use client'

import { useState, useTransition } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { syncCommitmentsAction } from '../server/monthly-payment-actions'

interface SyncCommitmentsButtonProps {
  monthStr: string
}

export function SyncCommitmentsButton({ monthStr }: SyncCommitmentsButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  function handleSync() {
    setFeedback(null)
    setIsError(false)

    startTransition(async () => {
      const res = await syncCommitmentsAction(monthStr)
      if (!res.success) {
        setIsError(true)
        setFeedback(res.message)
      } else {
        setFeedback(res.message)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        id="sync-commitments-btn"
        type="button"
        disabled={isPending}
        onClick={handleSync}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 disabled:opacity-50 text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[36px]"
        title="Add missing monthly payments from eligible recurring payment sources without changing existing snapshots."
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Syncing...</span>
          </>
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Payments</span>
          </>
        )}
      </button>

      {feedback && (
        <span
          className={`text-[11px] ${
            isError ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-medium'
          }`}
        >
          {feedback}
        </span>
      )}
    </div>
  )
}
