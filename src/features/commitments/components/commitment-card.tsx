import Link from 'next/link'
import { Calendar, CreditCard, Repeat, HeartHandshake, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDay } from '@/lib/format'
import type { CommitmentWithRelations } from '../server/commitment-service'

interface CommitmentCardProps {
  commitment: CommitmentWithRelations
}

export function CommitmentCard({ commitment }: CommitmentCardProps) {
  const {
    id,
    name,
    defaultAmount,
    dueDay,
    variableAmount,
    transferToWife,
    category,
    account,
  } = commitment

  return (
    <Link
      href={`/commitments/${id}`}
      className="block bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all hover:bg-slate-800/60 active:bg-slate-800/80 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-100 text-base group-hover:text-emerald-400 transition-colors truncate">
              {name}
            </h3>
          </div>

          <p className="text-xs text-slate-400 font-medium">{category.name}</p>
        </div>

        <div className="text-right flex-shrink-0 flex items-center gap-2">
          <div>
            <span className="text-base font-bold text-slate-100 tabular-nums block">
              {formatCurrency(defaultAmount)}
            </span>
            <span className="text-[11px] text-slate-500 block">/ month</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors hidden sm:block" />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs text-slate-400">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>Due {formatDay(dueDay)}</span>
          </div>

          {account ? (
            <div className="flex items-center gap-1.5 text-slate-400">
              <CreditCard className="h-3.5 w-3.5 text-slate-500" />
              <span className="truncate max-w-[130px] sm:max-w-[180px]">{account.name}</span>
            </div>
          ) : null}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          {variableAmount && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <Repeat className="h-3 w-3" />
              Variable
            </span>
          )}

          {transferToWife && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
              <HeartHandshake className="h-3 w-3" />
              Transfer to Wife
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
