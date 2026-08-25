'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Banknote } from 'lucide-react'
import type { WifeTransferSummary } from '../types/wife-transfer-types'
import { WifeTransferMonthNav } from './wife-transfer-month-nav'
import { WifeTransferSummaryCard } from './wife-transfer-summary'
import { WifeTransferItemList } from './wife-transfer-item-list'
import { WifeTransferHistory } from './wife-transfer-history'
import { RecordWifeTransferDialog } from './record-wife-transfer-dialog'

interface AccountOption {
  id: string
  name: string
  institutionName: string | null
}

interface WifeTransferViewProps {
  summary: WifeTransferSummary
  accounts: AccountOption[]
}

const MONTH_NAMES = [
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

export function WifeTransferView({ summary, accounts }: WifeTransferViewProps) {
  const [showRecordDialog, setShowRecordDialog] = useState(false)

  const monthName = MONTH_NAMES[summary.month - 1] ?? ''
  const monthLabel = `${monthName} ${summary.year}`

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
              <h1 className="text-xl font-bold text-white tracking-tight">Transfer to Wife</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Funding tracker for {monthLabel}
              </p>
            </div>
          </div>
        </header>

        {/* Month Navigator */}
        <div className="flex justify-center">
          <WifeTransferMonthNav year={summary.year} month={summary.month} />
        </div>

        {/* Check if payments have been prepared for this month */}
        {!summary.isPrepared && summary.paymentCount === 0 ? (
          /* Empty / Unprepared State */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-5 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
              <CalendarDays className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-white">
                No transfer obligations prepared for {monthName}
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Prepare monthly payments first or ensure active commitments have <strong>Transfer to Wife</strong> enabled.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5 max-w-xs mx-auto">
              <Link
                href={`/payments?month=${summary.resolvedMonth}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-all min-h-[44px]"
              >
                <Banknote className="h-4 w-4" />
                <span>View Monthly Payments</span>
              </Link>
              <Link
                href="/commitments"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-800 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all min-h-[44px]"
              >
                <span>View Commitments</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Active Content State */
          <div className="space-y-6">
            {/* Summary Card */}
            <WifeTransferSummaryCard
              summary={summary}
              onRecordClick={() => setShowRecordDialog(true)}
            />

            {/* Included & Unconfirmed Payment Items */}
            <WifeTransferItemList
              includedItems={summary.includedItems}
              unconfirmedItems={summary.unconfirmedItems}
              skippedItems={summary.skippedItems}
            />

            {/* Transfer History List */}
            <WifeTransferHistory
              transfers={summary.transfers}
              monthLabel={monthLabel}
            />
          </div>
        )}
      </div>

      {/* Record Transfer Dialog Modal */}
      <RecordWifeTransferDialog
        open={showRecordDialog}
        onOpenChange={setShowRecordDialog}
        paymentYear={summary.year}
        paymentMonth={summary.month}
        remainingAmount={summary.remainingTotal}
        accounts={accounts}
        monthLabel={monthLabel}
      />
    </div>
  )
}
