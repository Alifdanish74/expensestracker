import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { getFinancialSettings } from '@/features/profile/server/financial-settings-actions'
import { FinancialSettingsForm } from '@/features/profile/components/financial-settings-form'

export const metadata = {
  title: 'Financial Settings — Expense Tracker',
  description: 'Set your monthly net income and salary day used by the dashboard.',
}

export default async function FinancialSettingsPage() {
  const settings = await getFinancialSettings()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <header className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-3"
            aria-label="Back to Dashboard"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Financial Settings
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Set the basic monthly income used for your dashboard.
          </p>
        </header>

        {/* Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <FinancialSettingsForm
            initialIncome={settings.monthlyNetIncome}
            initialSalaryDay={settings.salaryDay}
          />
        </div>

        {/* Info Note */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-400">Note:</span>{' '}
            Monthly Net Income represents your default take-home pay and is used to calculate
            your remaining balance on the dashboard. It is not recorded as an income transaction.
          </p>
        </div>
      </div>
    </div>
  )
}
