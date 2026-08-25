import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getActiveCommitments } from '@/features/commitments/server/commitment-service'
import { CommitmentList } from '@/features/commitments/components/commitment-list'

export const metadata = {
  title: 'Monthly Commitments — Expense Tracker',
  description: 'Manage your recurring monthly obligations.',
}

export default async function CommitmentsPage() {
  const { commitments, totalDefaultAmount } = await getActiveCommitments()

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all min-h-[44px] min-w-[44px]"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Monthly Commitments</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your recurring monthly obligations.
              </p>
            </div>
          </div>
        </header>

        {/* Commitment List & Total */}
        <CommitmentList commitments={commitments} totalDefaultAmount={totalDefaultAmount} />
      </div>
    </div>
  )
}
