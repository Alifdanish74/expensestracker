import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface EmptyPrerequisiteGuardProps {
  /** What is missing, e.g. "no active accounts" */
  message: string
  /** Call to action label */
  ctaLabel: string
  /** Call to action href */
  ctaHref: string
  /** Optional secondary message */
  detail?: string
  icon?: LucideIcon
}

/**
 * Renders a friendly, non-broken message when a required prerequisite is absent.
 * Used by New Transaction pages when no Accounts / Categories / Expenses are available.
 */
export function EmptyPrerequisiteGuard({
  message,
  ctaLabel,
  ctaHref,
  detail,
  icon: Icon,
}: EmptyPrerequisiteGuardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
          <Icon className="h-6 w-6 text-slate-500" aria-hidden="true" />
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-slate-200">{message}</p>
        {detail && <p className="text-xs text-slate-400 leading-relaxed">{detail}</p>}
      </div>
      <Link
        href={ctaHref}
        className="inline-flex items-center justify-center px-5 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
