import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  getInstallmentById,
  getCategoriesForInstallmentForm,
  getAccountsForInstallmentForm,
  getInstallmentPaymentHistoryCount,
} from '@/features/installments/server/installment-service'
import { updateInstallmentAction } from '@/features/installments/server/installment-actions'
import { InstallmentForm } from '@/features/installments/components/installment-form'

export const metadata = {
  title: 'Edit Instalment — Expense Tracker',
  description: 'Update instalment details.',
}

interface EditInstalmentPageProps {
  params: Promise<{ id: string }>
}

export default async function EditInstalmentPage({ params }: EditInstalmentPageProps) {
  const { id } = await params

  const installment = await getInstallmentById(id)

  if (!installment) {
    notFound()
  }

  const [categories, accounts, historyCount] = await Promise.all([
    getCategoriesForInstallmentForm(installment.category.id),
    getAccountsForInstallmentForm(installment.account?.id),
    getInstallmentPaymentHistoryCount(id),
  ])

  const initialData = {
    name: installment.name,
    monthlyAmount: installment.monthlyAmount,
    categoryId: installment.category.id,
    accountId: installment.account?.id ?? '',
    remainingPayments: installment.remainingPayments,
    totalPayments: installment.totalPayments ?? '',
    dueDay: installment.dueDay,
    startDate: installment.startDate,
    notes: installment.notes ?? '',
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <header className="flex items-center gap-3">
          <Link
            href={`/installments/${id}`}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all min-h-[44px] min-w-[44px]"
            aria-label="Back to instalment detail"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Edit Instalment</h1>
            <p className="text-xs text-slate-500 mt-0.5">{installment.name}</p>
          </div>
        </header>

        {/* Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <InstallmentForm
            categories={categories}
            accounts={accounts}
            onSubmit={async (values) => {
              'use server'
              return updateInstallmentAction(id, values)
            }}
            mode="edit"
            initialData={initialData}
            installmentId={id}
            cancelHref={`/installments/${id}`}
            hasPaymentHistory={historyCount > 0}
          />
        </div>
      </div>
    </div>
  )
}
