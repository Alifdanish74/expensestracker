import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  getCategoriesForCommitmentForm,
  getAccountsForCommitmentForm,
} from '@/features/commitments/server/commitment-service'
import { createCommitmentAction } from '@/features/commitments/server/commitment-actions'
import { CommitmentForm } from '@/features/commitments/components/commitment-form'

export const metadata = {
  title: 'Add Commitment — Expense Tracker',
  description: 'Create a new monthly commitment template.',
}

export default async function NewCommitmentPage() {
  const [categories, accounts] = await Promise.all([
    getCategoriesForCommitmentForm(),
    getAccountsForCommitmentForm(),
  ])

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <header className="flex items-center gap-3">
          <Link
            href="/commitments"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all min-h-[44px] min-w-[44px]"
            aria-label="Back to commitments"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Add Commitment</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Set up a recurring monthly obligation template.
            </p>
          </div>
        </header>

        {/* Commitment Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <CommitmentForm
            categories={categories}
            accounts={accounts}
            onSubmit={createCommitmentAction}
            mode="create"
          />
        </div>
      </div>
    </div>
  )
}
