import Link from 'next/link'
import { Plus, CreditCard, CheckCircle2 } from 'lucide-react'
import { InstallmentCard } from './installment-card'
import type { InstallmentWithRelations } from '../server/installment-service'

interface InstallmentListProps {
  installments: InstallmentWithRelations[]
}

export function InstallmentList({ installments }: InstallmentListProps) {
  const hasInstallments = installments.length > 0

  const activeInstallments = installments.filter((i) => i.remainingPayments > 0)
  const completedInstallments = installments.filter((i) => i.remainingPayments === 0)

  return (
    <div className="space-y-6">
      {/* ── Primary Action Button ── */}
      <div>
        <Link
          id="add-instalment-button"
          href="/installments/new"
          className="flex items-center justify-center gap-2 w-full py-3 min-h-[48px] bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-950/40"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Instalment
        </Link>
      </div>

      {/* ── List / Empty State ── */}
      {!hasInstallments ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
            <CreditCard className="h-6 w-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-200">No instalments yet.</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Add financing plans, credit-card instalments, or other fixed-term monthly payments.
            </p>
          </div>
          <Link
            href="/installments/new"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all min-h-[44px]"
          >
            Add Instalment
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Section */}
          {activeInstallments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                Active Instalments ({activeInstallments.length})
              </h2>
              <div className="space-y-3">
                {activeInstallments.map((installment) => (
                  <InstallmentCard key={installment.id} installment={installment} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Section */}
          {completedInstallments.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 px-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed Instalments ({completedInstallments.length})
              </h2>
              <div className="space-y-3">
                {completedInstallments.map((installment) => (
                  <InstallmentCard key={installment.id} installment={installment} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
