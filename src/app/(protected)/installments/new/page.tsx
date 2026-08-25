import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  getCategoriesForInstallmentForm,
  getAccountsForInstallmentForm,
} from '@/features/installments/server/installment-service'
import { createInstallmentAction } from '@/features/installments/server/installment-actions'
import { InstallmentForm } from '@/features/installments/components/installment-form'

export const metadata = {
  title: 'Add Instalment — Expense Tracker',
  description: 'Create a new finite monthly payment plan.',
}

export default async function NewInstalmentPage() {
  const [categories, accounts] = await Promise.all([
    getCategoriesForInstallmentForm(),
    getAccountsForInstallmentForm(),
  ])

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <header className="flex items-center gap-3">
          <Link
            href="/installments"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all min-h-[44px] min-w-[44px]"
            aria-label="Back to instalments"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Add Instalment</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Set up a finite monthly payment plan.
            </p>
          </div>
        </header>

        {/* Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <InstallmentForm
            categories={categories}
            accounts={accounts}
            onSubmit={createInstallmentAction}
            mode="create"
          />
        </div>
      </div>
    </div>
  )
}
