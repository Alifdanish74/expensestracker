import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getActiveInstallments } from '@/features/installments/server/installment-service'
import { InstallmentList } from '@/features/installments/components/installment-list'

export const metadata = {
  title: 'Instalments — Expense Tracker',
  description: 'Track finite monthly payment plans and how many payments remain.',
}

export default async function InstalmentsPage() {
  const installments = await getActiveInstallments()

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <header className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all min-h-[44px] min-w-[44px]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Instalments</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track finite monthly payment plans and how many payments remain.
            </p>
          </div>
        </header>

        {/* Instalment List */}
        <InstallmentList installments={installments} />
      </div>
    </div>
  )
}
