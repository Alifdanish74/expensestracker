import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  getTransactionById,
  getAccountsForEditForm,
  getCategoriesForEditForm,
  getActiveNonCreditCardAccountsForForm,
  getCreditCardAccountsForForm,
  getExpensesForRefundForm,
  getActiveAccountsForForm,
} from '@/features/transactions/server/transaction-service'
import { ExpenseForm } from '@/features/transactions/components/expense-form'
import { IncomeForm } from '@/features/transactions/components/income-form'
import { TransferForm } from '@/features/transactions/components/transfer-form'
import { CardPaymentForm } from '@/features/transactions/components/card-payment-form'
import { RefundForm } from '@/features/transactions/components/refund-form'
import { updateExpenseAction } from '@/features/transactions/server/transaction-actions'
import { updateIncomeAction } from '@/features/transactions/server/income-actions'
import { updateTransferAction } from '@/features/transactions/server/transfer-actions'
import { updateCardPaymentAction } from '@/features/transactions/server/card-payment-actions'
import { updateRefundAction } from '@/features/transactions/server/refund-actions'
import { getTransactionTypeLabel, getTransactionTypeBadgeClass } from '@/features/transactions/utils/transaction-type-utils'
import { cn } from '@/lib/utils'

interface EditTransactionPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditTransactionPageProps) {
  const { id } = await params
  const transaction = await getTransactionById(id)
  if (!transaction) return { title: 'Transaction Not Found — Expense Tracker' }
  return {
    title: `Edit ${transaction.description} — Expense Tracker`,
    description: `Edit the ${getTransactionTypeLabel(transaction.type).toLowerCase()}: ${transaction.description}.`,
  }
}

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  const { id } = await params
  const transaction = await getTransactionById(id)

  if (!transaction) notFound()
  // ADJUSTMENT is out of scope — 404 rather than silently failing
  if (transaction.type === 'ADJUSTMENT') notFound()

  const detailHref = `/transactions/${id}`
  const typeLabel = getTransactionTypeLabel(transaction.type)

  // ── EXPENSE ─────────────────────────────────────────────────────────────────
  if (transaction.type === 'EXPENSE') {
    const [accounts, categories] = await Promise.all([
      getAccountsForEditForm(transaction.account.id),
      getCategoriesForEditForm(transaction.category!.id),
    ])

    async function handleUpdateExpense(
      values: import('@/features/transactions/schemas/expense-schema').ExpenseFormValues
    ) {
      'use server'
      return updateExpenseAction(id, values)
    }

    return (
      <EditPageShell detailHref={detailHref} typeLabel={typeLabel} transactionType={transaction.type}>
        <ExpenseForm
          accounts={accounts}
          categories={categories}
          onSubmit={handleUpdateExpense}
          mode="edit"
          transactionId={id}
          cancelHref={detailHref}
          initialData={{
            amount: transaction.amount,
            description: transaction.description,
            categoryId: transaction.category!.id,
            accountId: transaction.account.id,
            transactionDate: transaction.transactionDate,
            essential: transaction.essential,
            notes: transaction.notes ?? '',
          }}
        />
      </EditPageShell>
    )
  }

  // ── INCOME ──────────────────────────────────────────────────────────────────
  if (transaction.type === 'INCOME') {
    const accounts = await getActiveNonCreditCardAccountsForForm()

    async function handleUpdateIncome(
      values: import('@/features/transactions/schemas/income-schema').IncomeFormValues
    ) {
      'use server'
      return updateIncomeAction(id, values)
    }

    return (
      <EditPageShell detailHref={detailHref} typeLabel={typeLabel} transactionType={transaction.type}>
        <IncomeForm
          accounts={accounts}
          onSubmit={handleUpdateIncome}
          mode="edit"
          transactionId={id}
          cancelHref={detailHref}
          initialData={{
            amount: transaction.amount,
            description: transaction.description,
            accountId: transaction.account.id,
            transactionDate: transaction.transactionDate,
            notes: transaction.notes ?? '',
          }}
        />
      </EditPageShell>
    )
  }

  // ── TRANSFER ─────────────────────────────────────────────────────────────────
  if (transaction.type === 'TRANSFER') {
    const accounts = await getActiveNonCreditCardAccountsForForm()

    async function handleUpdateTransfer(
      values: import('@/features/transactions/schemas/transfer-schema').TransferFormValues
    ) {
      'use server'
      return updateTransferAction(id, values)
    }

    return (
      <EditPageShell detailHref={detailHref} typeLabel={typeLabel} transactionType={transaction.type}>
        <TransferForm
          accounts={accounts}
          onSubmit={handleUpdateTransfer}
          mode="edit"
          transactionId={id}
          cancelHref={detailHref}
          initialData={{
            amount: transaction.amount,
            description: transaction.description,
            accountId: transaction.account.id,
            destinationAccountId: transaction.destinationAccount?.id ?? '',
            transactionDate: transaction.transactionDate,
            notes: transaction.notes ?? '',
          }}
        />
      </EditPageShell>
    )
  }

  // ── CARD_PAYMENT ─────────────────────────────────────────────────────────────
  if (transaction.type === 'CARD_PAYMENT') {
    const [sourceAccounts, creditCards] = await Promise.all([
      getActiveNonCreditCardAccountsForForm(),
      getCreditCardAccountsForForm(),
    ])

    async function handleUpdateCardPayment(
      values: import('@/features/transactions/schemas/card-payment-schema').CardPaymentFormValues
    ) {
      'use server'
      return updateCardPaymentAction(id, values)
    }

    return (
      <EditPageShell detailHref={detailHref} typeLabel={typeLabel} transactionType={transaction.type}>
        <CardPaymentForm
          sourceAccounts={sourceAccounts}
          creditCards={creditCards}
          onSubmit={handleUpdateCardPayment}
          mode="edit"
          transactionId={id}
          cancelHref={detailHref}
          initialData={{
            amount: transaction.amount,
            description: transaction.description,
            accountId: transaction.account.id,
            destinationAccountId: transaction.destinationAccount?.id ?? '',
            transactionDate: transaction.transactionDate,
            notes: transaction.notes ?? '',
          }}
        />
      </EditPageShell>
    )
  }

  // ── REFUND ────────────────────────────────────────────────────────────────────
  if (transaction.type === 'REFUND') {
    const [expenses, accounts] = await Promise.all([
      getExpensesForRefundForm(),
      getActiveAccountsForForm(),
    ])

    async function handleUpdateRefund(
      values: import('@/features/transactions/schemas/refund-schema').RefundFormValues
    ) {
      'use server'
      return updateRefundAction(id, values)
    }

    return (
      <EditPageShell detailHref={detailHref} typeLabel={typeLabel} transactionType={transaction.type}>
        <RefundForm
          expenses={expenses}
          accounts={accounts}
          onSubmit={handleUpdateRefund}
          mode="edit"
          transactionId={id}
          cancelHref={detailHref}
          initialData={{
            amount: transaction.amount,
            description: transaction.description,
            accountId: transaction.account.id,
            relatedTransactionId: transaction.relatedTransaction?.id ?? '',
            transactionDate: transaction.transactionDate,
            notes: transaction.notes ?? '',
          }}
        />
      </EditPageShell>
    )
  }

  // Fallback (unreachable for known types)
  notFound()
}

// ── Shared layout shell ───────────────────────────────────────────────────────

interface EditPageShellProps {
  detailHref: string
  typeLabel: string
  transactionType: string
  children: React.ReactNode
}

function EditPageShell({ detailHref, typeLabel, transactionType, children }: EditPageShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">
        {/* Back navigation */}
        <Link
          href={detailHref}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm mb-6 min-h-[44px] -ml-1 px-1 w-fit"
          aria-label="Back to transaction detail"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
              getTransactionTypeBadgeClass(transactionType)
            )}>
              {typeLabel}
            </span>
            <span className="text-xs text-slate-500">— Type cannot be changed</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Edit {typeLabel}</h1>
          <p className="text-sm text-slate-400 mt-1">Update the details below.</p>
        </div>

        {/* Form card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  )
}
