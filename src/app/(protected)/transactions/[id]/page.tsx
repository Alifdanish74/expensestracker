import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, ArrowRight, RotateCcw } from 'lucide-react'
import { getTransactionById } from '@/features/transactions/server/transaction-service'
import { DeleteTransactionDialog } from '@/features/transactions/components/delete-transaction-dialog'
import { formatCurrency } from '@/lib/format'
import {
  getAmountColourClass,
  formatDisplayAmount,
  getTransactionTypeLabel,
  getTransactionTypeBadgeClass,
} from '@/features/transactions/utils/transaction-type-utils'
import { cn } from '@/lib/utils'

interface TransactionDetailPageProps {
  params: Promise<{ id: string }>
}

function formatTransactionDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getMonthFromDate(dateStr: string): string {
  return dateStr.slice(0, 7)
}

export async function generateMetadata({ params }: TransactionDetailPageProps) {
  const { id } = await params
  const transaction = await getTransactionById(id)
  if (!transaction) return { title: 'Transaction Not Found — Expense Tracker' }
  return {
    title: `${transaction.description} — Expense Tracker`,
    description: `View ${getTransactionTypeLabel(transaction.type).toLowerCase()} details for ${transaction.description}.`,
  }
}

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { id } = await params
  const transaction = await getTransactionById(id)

  if (!transaction) notFound()

  const transactionMonth = getMonthFromDate(transaction.transactionDate)
  const backHref = `/transactions?month=${transactionMonth}`
  const editHref = `/transactions/${id}/edit`
  const deleteReturnTo = `/transactions?month=${transactionMonth}`

  const formattedAmount = formatCurrency(transaction.amount)
  const displayAmount = formatDisplayAmount(transaction.type, formattedAmount)
  const amountColour = getAmountColourClass(transaction.type)
  const typeLabel = getTransactionTypeLabel(transaction.type)

  const isExpense = transaction.type === 'EXPENSE'
  const isRefund = transaction.type === 'REFUND'
  const isMovement = transaction.type === 'TRANSFER' || transaction.type === 'CARD_PAYMENT'
  const refundTotalNum = parseFloat(transaction.refundTotal)
  const originalAmountNum = parseFloat(transaction.amount)
  const hasRefunds = isExpense && refundTotalNum > 0
  const netAfterRefunds = originalAmountNum - refundTotalNum

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-28">
        {/* Back navigation */}
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm mb-6 min-h-[44px] -ml-1 px-1 w-fit"
          aria-label="Back to transactions"
        >
          <ArrowLeft className="h-4 w-4" />
          Transactions
        </Link>

        {/* Type badge + Amount hero */}
        <div className="mb-6">
          {/* Type badge (always visible) */}
          <span className={cn(
            'inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-2',
            getTransactionTypeBadgeClass(transaction.type)
          )}>
            {typeLabel}
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            {transaction.description}
          </h1>

          <p className={cn('text-3xl font-bold tabular-nums', amountColour)}>
            {displayAmount}
          </p>

          {/* Refund summary for EXPENSE */}
          {hasRefunds && (
            <div className="mt-2 space-y-0.5">
              <p className="text-sm text-teal-400 tabular-nums">
                Refunded: −{formatCurrency(transaction.refundTotal)}
              </p>
              <p className="text-sm font-semibold text-rose-300 tabular-nums">
                Net: {formatCurrency(netAfterRefunds.toFixed(2))}
              </p>
            </div>
          )}
        </div>

        {/* Detail card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-5">
          {/* Movement direction (TRANSFER / CARD_PAYMENT) */}
          {isMovement && transaction.destinationAccount && (
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex-shrink-0 w-24">Direction</p>
              <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                <span className="text-sm font-medium text-slate-200 truncate">{transaction.account.name}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-200 truncate">{transaction.destinationAccount.name}</span>
              </div>
            </div>
          )}

          {/* Category (EXPENSE only) */}
          {isExpense && transaction.category && (
            <DetailRow label="Category" value={transaction.category.name} />
          )}

          {/* Original Expense (REFUND only) */}
          {isRefund && transaction.relatedTransaction && (
            <div className="px-4 py-3.5 border-b border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Original Expense</p>
              <Link
                href={`/transactions/${transaction.relatedTransaction.id}`}
                className="block bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5 hover:bg-slate-800 transition-colors"
              >
                <p className="text-sm font-medium text-slate-100 truncate">{transaction.relatedTransaction.description}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-500">
                    {transaction.relatedTransaction.category?.name ?? 'No category'}
                    {' · '}
                    {formatTransactionDate(transaction.relatedTransaction.transactionDate)}
                  </p>
                  <p className="text-xs font-semibold text-rose-400 tabular-nums">
                    {formatCurrency(transaction.relatedTransaction.amount)}
                  </p>
                </div>
              </Link>
            </div>
          )}

          {/* Account */}
          <DetailRow
            label={isMovement ? 'From' : isRefund ? 'Received Into' : isExpense ? 'Paid Using' : 'Account'}
            value={transaction.account.name}
          />

          {isMovement && transaction.destinationAccount && (
            <DetailRow label="To" value={transaction.destinationAccount.name} />
          )}

          {/* Date */}
          <DetailRow label="Date" value={formatTransactionDate(transaction.transactionDate)} />

          {/* Essential (EXPENSE only) */}
          {isExpense && (
            <DetailRow
              label="Essential"
              value={transaction.essential ? 'Yes' : 'No'}
              valueClassName={transaction.essential ? 'text-emerald-400' : 'text-slate-400'}
            />
          )}

          {/* Notes */}
          <DetailRow
            label="Notes"
            value={transaction.notes || '—'}
            valueClassName={!transaction.notes ? 'text-slate-600 italic' : undefined}
            isLast
          />
        </div>

        {/* EXPENSE: refund summary section */}
        {isExpense && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Refund Status</p>
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                hasRefunds
                  ? refundTotalNum >= originalAmountNum
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-800 text-slate-500'
              )}>
                {hasRefunds
                  ? refundTotalNum >= originalAmountNum ? 'Fully Refunded' : 'Partially Refunded'
                  : 'No Refunds'}
              </span>
            </div>
            {hasRefunds && (
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Original</span>
                  <span className="text-slate-100 font-medium tabular-nums">{formatCurrency(transaction.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Refunded</span>
                  <span className="text-teal-400 font-medium tabular-nums">−{formatCurrency(transaction.refundTotal)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-300 font-semibold">Net Expense</span>
                  <span className="text-rose-300 font-bold tabular-nums">{formatCurrency(netAfterRefunds.toFixed(2))}</span>
                </div>
              </div>
            )}
            {/* Record refund shortcut */}
            {refundTotalNum < originalAmountNum && (
              <Link
                href={`/transactions/new/refund?expenseId=${id}`}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-xl transition-all min-h-[44px]"
              >
                <RotateCcw className="h-4 w-4 flex-shrink-0" />
                Record Refund for This Expense
              </Link>
            )}
          </div>
        )}

        {/* Card payment info note */}
        {transaction.type === 'CARD_PAYMENT' && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-5 text-xs text-indigo-300 leading-relaxed">
            Card payments are not counted as spending. This records the fund movement from your bank account to settle your credit card balance.
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href={editHref}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-xl transition-all min-h-[44px]"
            aria-label={`Edit this ${typeLabel.toLowerCase()}`}
          >
            <Pencil className="h-4 w-4 flex-shrink-0 text-slate-400" />
            Edit {typeLabel}
          </Link>

          <DeleteTransactionDialog
            transactionId={id}
            description={transaction.description}
            amount={transaction.amount}
            type={transaction.type}
            returnTo={deleteReturnTo}
          />
        </div>
      </div>
    </div>
  )
}

// ── Sub-component ─────────────────────────────────────────────────────────────

interface DetailRowProps {
  label: string
  value: string
  valueClassName?: string
  isLast?: boolean
}

function DetailRow({ label, value, valueClassName, isLast }: DetailRowProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 px-4 py-3.5 ${
        isLast ? '' : 'border-b border-slate-800'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-0.5 flex-shrink-0 w-24">
        {label}
      </p>
      <p className={`text-sm font-medium text-slate-100 text-right flex-1 ${valueClassName ?? ''}`}>
        {value}
      </p>
    </div>
  )
}
