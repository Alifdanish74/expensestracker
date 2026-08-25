'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Tag,
  CreditCard,
  HeartHandshake,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  AlertTriangle,
  Clock,
  Ban,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { MonthlyPaymentWithRelations } from '../types/monthly-payment-types'
import {
  isPaymentOverdue,
  calculateRemainingObligation,
  getStatusBadgeConfig,
} from '../utils/payment-status-utils'
import { ConfirmAmountDialog } from './confirm-amount-dialog'
import { MarkPaidDialog } from './mark-paid-dialog'
import { PartialPaymentDialog } from './partial-payment-dialog'
import { SkipPaymentDialog } from './skip-payment-dialog'

interface PaymentDetailViewProps {
  payment: MonthlyPaymentWithRelations
}

const FULL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const parts = dateStr.slice(0, 10).split('-').map(Number)
  const y = parts[0]
  const m = parts[1]
  const d = parts[2]
  if (!y || !m || !d) return dateStr
  const monthName = FULL_MONTHS[m - 1] ?? ''
  return `${d} ${monthName} ${y}`
}

export function PaymentDetailView({ payment }: PaymentDetailViewProps) {
  const [activeDialog, setActiveDialog] = useState<
    'confirm' | 'markPaid' | 'partial' | 'addPayment' | 'skip' | 'skipRemaining' | null
  >(null)

  const isOverdue = isPaymentOverdue(payment.dueDate, payment.status)
  const badgeConfig = getStatusBadgeConfig(payment.status, isOverdue)
  const remaining = calculateRemainingObligation(
    payment.plannedAmount,
    payment.actualAmount,
    payment.status
  )

  const monthStr = `${payment.paymentYear}-${String(payment.paymentMonth).padStart(2, '0')}`
  const monthName = FULL_MONTHS[payment.paymentMonth - 1] ?? ''
  const monthLabel = `${monthName} ${payment.paymentYear}`

  const formattedDueDate = formatFullDate(payment.dueDate)
  const formattedPaidDate = formatFullDate(payment.paidDate)

  const isInstalment = payment.sourceType === 'INSTALLMENT' || !!payment.installmentId
  const sourceTitle = payment.sourceName || payment.commitmentName

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Navigation Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/payments?month=${monthStr}`}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-all min-h-[44px] min-w-[44px]"
              aria-label="Back to payments list"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Payment Detail</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {monthLabel} {isInstalment ? 'Instalment' : 'Commitment'}
              </p>
            </div>
          </div>
        </header>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
          {/* Top Header: Title & Badges */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
                  {sourceTitle}
                </h2>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isInstalment
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}
                  >
                    {isInstalment ? 'Instalment Payment' : 'Commitment Payment'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${badgeConfig.className}`}
                >
                  {badgeConfig.label}
                </span>
                {badgeConfig.secondaryLabel && badgeConfig.secondaryClassName && (
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeConfig.secondaryClassName}`}
                  >
                    {badgeConfig.secondaryLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Category / Account / Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                {payment.category.name}
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                {payment.account ? payment.account.name : 'No default account'}
              </span>

              {payment.transferToWife && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">
                  <HeartHandshake className="h-3.5 w-3.5 text-purple-400" />
                  Transfer to Wife
                </span>
              )}

              {payment.variableAmount && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                  Variable Amount
                </span>
              )}
            </div>
          </div>

          {/* Financial Metrics Section */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Planned Amount</span>
              <span className="text-sm font-bold text-white">
                {formatCurrency(payment.plannedAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Paid So Far</span>
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(payment.actualAmount ?? '0.00')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
              <span className="text-slate-300 font-semibold">Remaining Obligation</span>
              <span className="text-sm font-bold text-blue-400">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          {/* Dates & Timeline */}
          <div className="space-y-2 text-xs text-slate-300 pt-1">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Due Date
              </span>
              <span className="font-semibold text-slate-200">{formattedDueDate}</span>
            </div>

            {payment.paidDate && (
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Paid Date
                </span>
                <span className="font-semibold text-emerald-400">{formattedPaidDate}</span>
              </div>
            )}
          </div>

          {/* Interactive Actions */}
          <div className="pt-2 space-y-3">
            {payment.status === 'AMOUNT_REQUIRED' && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setActiveDialog('confirm')}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 active:bg-amber-600 transition-all min-h-[44px]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Monthly Amount</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDialog('skip')}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-800 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 active:bg-slate-600 transition-all min-h-[44px]"
                >
                  <Ban className="h-4 w-4 text-slate-400" />
                  <span>Skip This Month</span>
                </button>
              </div>
            )}

            {payment.status === 'PENDING' && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setActiveDialog('markPaid')}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 active:bg-emerald-600 transition-all min-h-[44px]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mark Paid</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveDialog('partial')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-slate-800 bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 active:bg-slate-600 transition-all min-h-[44px]"
                  >
                    <PlusCircle className="h-4 w-4 text-blue-400" />
                    <span>Record Partial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDialog('skip')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-slate-800 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 active:bg-slate-600 transition-all min-h-[44px]"
                  >
                    <Ban className="h-4 w-4 text-slate-400" />
                    <span>Skip Month</span>
                  </button>
                </div>
              </div>
            )}

            {payment.status === 'PARTIALLY_PAID' && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setActiveDialog('addPayment')}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 active:bg-blue-700 transition-all min-h-[44px]"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDialog('skipRemaining')}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-800 bg-slate-800 text-amber-400 text-xs font-semibold hover:bg-slate-700 active:bg-slate-600 transition-all min-h-[44px]"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Skip Remaining</span>
                </button>
              </div>
            )}

            {payment.status === 'PAID' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-center text-xs space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Payment Complete</span>
                </div>
                <p className="text-slate-400">
                  This obligation has been fully paid for {monthLabel}.
                </p>
              </div>
            )}

            {payment.status === 'SKIPPED' && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-center text-xs space-y-1">
                <div className="font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>Payment Skipped</span>
                </div>
                <p className="text-slate-400">
                  This obligation was skipped for {monthLabel}. Future recurring commitments/instalments remain active.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Modals */}
      <ConfirmAmountDialog
        open={activeDialog === 'confirm'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        paymentId={payment.id}
        commitmentName={sourceTitle}
        defaultAmount={payment.plannedAmount}
        monthLabel={monthLabel}
      />

      <MarkPaidDialog
        open={activeDialog === 'markPaid'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        paymentId={payment.id}
        commitmentName={sourceTitle}
        plannedAmount={payment.plannedAmount}
      />

      <PartialPaymentDialog
        open={activeDialog === 'partial'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        paymentId={payment.id}
        commitmentName={sourceTitle}
        plannedAmount={payment.plannedAmount}
        currentPaidAmount={payment.actualAmount ?? '0.00'}
        remainingAmount={remaining.toFixed(2)}
        isAddPayment={false}
      />

      <PartialPaymentDialog
        open={activeDialog === 'addPayment'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        paymentId={payment.id}
        commitmentName={sourceTitle}
        plannedAmount={payment.plannedAmount}
        currentPaidAmount={payment.actualAmount ?? '0.00'}
        remainingAmount={remaining.toFixed(2)}
        isAddPayment={true}
      />

      <SkipPaymentDialog
        open={activeDialog === 'skip'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        paymentId={payment.id}
        commitmentName={sourceTitle}
        plannedAmount={payment.plannedAmount}
        monthLabel={monthLabel}
        isSkipRemaining={false}
      />

      <SkipPaymentDialog
        open={activeDialog === 'skipRemaining'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        paymentId={payment.id}
        commitmentName={sourceTitle}
        plannedAmount={payment.plannedAmount}
        actualAmount={payment.actualAmount}
        remainingAmount={remaining.toFixed(2)}
        monthLabel={monthLabel}
        isSkipRemaining={true}
      />
    </div>
  )
}
