'use client'

import { useState } from 'react'
import { Loader2, Archive, X } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { archiveCommitmentAction } from '../server/commitment-actions'

interface ArchiveCommitmentButtonProps {
  commitmentId: string
  commitmentName: string
  defaultAmount: string
}

export function ArchiveCommitmentButton({
  commitmentId,
  commitmentName,
  defaultAmount,
}: ArchiveCommitmentButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleArchive = async () => {
    setLoading(true)
    setError(null)
    try {
      await archiveCommitmentAction(commitmentId)
      // archiveCommitmentAction redirects on success
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
        throw err
      }
      setError(err instanceof Error ? err.message : 'Unable to archive commitment')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 rounded-xl text-sm font-medium transition-all min-h-[44px]"
        aria-label={`Archive ${commitmentName}`}
      >
        <Archive className="h-4 w-4" />
        Archive Commitment
      </button>

      {/* Confirmation Dialog */}
      {showDialog && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-commitment-dialog-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !loading && setShowDialog(false)}
          />

          {/* Dialog panel */}
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                <Archive className="h-5 w-5 text-rose-400" />
              </div>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                disabled={loading}
                className="text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
                aria-label="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <h2
                id="archive-commitment-dialog-title"
                className="text-base font-semibold text-slate-100"
              >
                Archive {commitmentName}?
              </h2>
              <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                {formatCurrency(defaultAmount)} / month
              </p>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Future payment generation will ignore this commitment. The commitment record will be preserved.
              </p>
            </div>

            {error && (
              <p
                className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                disabled={loading}
                className="flex-1 py-2.5 px-4 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-sm font-medium transition-all disabled:opacity-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchive}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Archiving…
                  </>
                ) : (
                  'Archive'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
