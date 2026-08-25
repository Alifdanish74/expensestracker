import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CreditCard, Edit3, Plus, Landmark } from 'lucide-react'
import { getCreditCardById, getRecentCardPayments } from '@/features/credit-cards/server/credit-card-service'
import {
  getCardStatements,
  getLatestStatement,
} from '@/features/credit-cards/server/credit-card-statement-service'
import { CreditCardBalanceDisplay } from '@/features/credit-cards/components/credit-card-balance-display'
import { CreditUtilisationBar } from '@/features/credit-cards/components/credit-utilisation-bar'
import { StatementHistoryList } from '@/features/credit-cards/components/statement-history-list'
import { StatementCard } from '@/features/credit-cards/components/statement-card'
import { calculateEstimatedAvailableCredit } from '@/features/credit-cards/utils/credit-card-calculations'
import { formatCurrency, formatDay } from '@/lib/format'

interface CreditCardDetailPageProps {
  params: Promise<{ accountId: string }>
}

export async function generateMetadata({ params }: CreditCardDetailPageProps) {
  const { accountId } = await params
  const card = await getCreditCardById(accountId)
  if (!card) return { title: 'Card Not Found — Expense Tracker' }
  return {
    title: `${card.name} — Credit Card Detail`,
    description: `Track statements, limit, and utilisation for ${card.name}.`,
  }
}

export default async function CreditCardDetailPage({ params }: CreditCardDetailPageProps) {
  const { accountId } = await params

  const card = await getCreditCardById(accountId)
  if (!card) {
    notFound()
  }

  const [statements, latestStatement, recentPayments] = await Promise.all([
    getCardStatements(card.id),
    getLatestStatement(card.id),
    getRecentCardPayments(card.id),
  ])

  const estimatedAvailable = calculateEstimatedAvailableCredit(
    card.currentBalance,
    card.creditLimit
  )

  const cardPaymentUrl = `/transactions?account=${card.id}&type=CARD_PAYMENT`

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/credit-cards"
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm min-h-[44px] -ml-1 px-1"
            aria-label="Back to credit cards"
          >
            <ArrowLeft className="h-4 w-4" />
            Credit Cards
          </Link>

          <Link
            href={`/accounts/${card.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-xl transition-all min-h-[36px]"
            aria-label="Edit account settings"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Account
          </Link>
        </div>

        {/* Card Header Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{card.name}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              {card.institutionName && (
                <span className="flex items-center gap-1">
                  <Landmark className="h-3.5 w-3.5 text-slate-500" />
                  {card.institutionName}
                </span>
              )}
              {card.lastFourDigits && (
                <span className="font-mono text-slate-400">•••• {card.lastFourDigits}</span>
              )}
            </div>
          </div>
        </div>

        {/* Card Balance & Metrics Spotlight */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <CreditCardBalanceDisplay currentBalance={card.currentBalance} size="lg" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-1">
              <span className="text-slate-400 font-medium">Credit Limit</span>
              <p className="text-base font-bold text-slate-100 tabular-nums">
                {card.creditLimit != null
                  ? formatCurrency(card.creditLimit)
                  : 'Not configured'}
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-1">
              <span className="text-slate-400 font-medium">Est. Available Credit</span>
              <p className="text-base font-bold text-slate-100 tabular-nums">
                {estimatedAvailable != null
                  ? formatCurrency(estimatedAvailable)
                  : 'Not available'}
              </p>
            </div>
          </div>

          <CreditUtilisationBar currentBalance={card.currentBalance} creditLimit={card.creditLimit} />

          {(card.statementDay != null || card.dueDay != null) && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span>
                Statement Day: <strong className="text-slate-200">{formatDay(card.statementDay)}</strong>
              </span>
              <span>
                Due Day: <strong className="text-slate-200">{formatDay(card.dueDay)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Record Card Payment CTA Button */}
        <div>
          <Link
            href="/transactions/new/card-payment"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-950/40 transition-all text-sm min-h-[44px]"
          >
            <CreditCard className="h-4 w-4" />
            Record Card Payment
          </Link>
        </div>

        {/* Recent Card Payments Section */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-bold text-slate-100">Recent Card Payments</h2>
              <p className="text-xs text-slate-400">Payments made to settle this card</p>
            </div>
            {recentPayments.length > 0 && (
              <Link
                href={cardPaymentUrl}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                View All
              </Link>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {recentPayments.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-xs text-slate-500">No card payments recorded for this card yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {recentPayments.map((p) => (
                  <Link
                    key={p.id}
                    href={`/transactions/${p.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/40 transition-colors block"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-200">{p.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        From {p.sourceAccount.name} • {p.transactionDate}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-indigo-400 tabular-nums">
                      {formatCurrency(p.amount)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Latest Statement Spotlight */}
        {latestStatement && (
          <div className="space-y-2 pt-2">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Latest Statement
            </h2>
            <StatementCard statement={latestStatement} accountId={card.id} isLatest />
          </div>
        )}

        {/* Statement History Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-bold text-slate-100">Statement History</h2>
              <p className="text-xs text-slate-400">Historical billed snapshots</p>
            </div>
            <Link
              href={`/credit-cards/${card.id}/statements/new`}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition-all text-xs min-h-[38px] shadow-md shadow-indigo-950/30"
              aria-label="Record new statement"
            >
              <Plus className="h-3.5 w-3.5" />
              Record Statement
            </Link>
          </div>

          <StatementHistoryList statements={statements} accountId={card.id} />
        </div>
      </div>
    </div>
  )
}
