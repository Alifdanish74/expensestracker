import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  getCommitmentById,
  getCategoriesForCommitmentForm,
  getAccountsForCommitmentForm,
} from '@/features/commitments/server/commitment-service'
import { updateCommitmentAction } from '@/features/commitments/server/commitment-actions'
import { CommitmentForm } from '@/features/commitments/components/commitment-form'

export const metadata = {
  title: 'Edit Commitment — Expense Tracker',
  description: 'Update recurring monthly commitment details.',
}

interface EditCommitmentPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCommitmentPage({ params }: EditCommitmentPageProps) {
  const { id } = await params

  const commitment = await getCommitmentById(id)

  if (!commitment) {
    notFound()
  }

  const [categories, accounts] = await Promise.all([
    getCategoriesForCommitmentForm(commitment.category.id),
    getAccountsForCommitmentForm(commitment.account?.id),
  ])

  const initialData = {
    name: commitment.name,
    defaultAmount: commitment.defaultAmount,
    categoryId: commitment.category.id,
    accountId: commitment.account?.id ?? '',
    dueDay: commitment.dueDay,
    variableAmount: commitment.variableAmount,
    transferToWife: commitment.transferToWife,
    startDate: commitment.startDate,
    endDate: commitment.endDate ?? '',
    notes: commitment.notes ?? '',
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <header className="flex items-center gap-3">
          <Link
            href={`/commitments/${id}`}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all min-h-[44px] min-w-[44px]"
            aria-label="Back to commitment detail"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Edit Commitment</h1>
            <p className="text-xs text-slate-500 mt-0.5">{commitment.name}</p>
          </div>
        </header>

        {/* Commitment Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <CommitmentForm
            categories={categories}
            accounts={accounts}
            onSubmit={async (values) => {
              'use server'
              return updateCommitmentAction(id, values)
            }}
            mode="edit"
            initialData={initialData}
            commitmentId={id}
            cancelHref={`/commitments/${id}`}
          />
        </div>
      </div>
    </div>
  )
}
