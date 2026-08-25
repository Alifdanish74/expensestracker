import Link from 'next/link'
import { Wallet, Settings } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

interface DashboardIncomeCardProps {
  configured: boolean
  monthlyNetIncome: string | null
}

export function DashboardIncomeCard({ configured, monthlyNetIncome }: DashboardIncomeCardProps) {
  if (!configured || monthlyNetIncome === null) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Settings className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Monthly Net Income
            </p>
            <p className="text-sm font-semibold text-slate-200 mt-0.5">Not configured</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Set your monthly net income to track remaining spending capacity.
            </p>
          </div>
        </div>
        <Link
          href="/settings/financial"
          className="block w-full py-2.5 px-4 min-h-[44px] bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-xl transition-all text-center"
        >
          Set Income
        </Link>
      </div>
    )
  }

  const incomeNum = parseFloat(monthlyNetIncome)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Monthly Net Income
          </p>
        </div>
        <Link
          href="/settings/financial"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors p-1"
          aria-label="Edit financial settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="text-2xl font-bold text-slate-100 tracking-tight tabular-nums">
        {formatCurrency(incomeNum)}
      </p>
    </div>
  )
}
