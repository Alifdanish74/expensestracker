import Link from 'next/link'
import {
  CalendarDays,
  CreditCard,
  HeartHandshake,
  Layers,
  Settings,
  ChevronRight,
  CheckSquare,
} from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'

export const metadata = {
  title: 'More — Expense Tracker',
  description: 'Access commitments, instalments, credit cards, wife transfer, and settings.',
}

const SECTIONS = [
  {
    heading: 'Finance',
    items: [
      {
        href: '/commitments',
        icon: CalendarDays,
        label: 'Monthly Commitments',
        description: 'Recurring bills and fixed obligations',
        iconClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/10 border-emerald-500/20',
      },
      {
        href: '/installments',
        icon: Layers,
        label: 'Instalments',
        description: 'Hire-purchase and BNPL progress',
        iconClass: 'text-purple-400',
        bgClass: 'bg-purple-500/10 border-purple-500/20',
      },
      {
        href: '/credit-cards',
        icon: CreditCard,
        label: 'Credit Cards',
        description: 'Outstanding balance, limit and statements',
        iconClass: 'text-indigo-400',
        bgClass: 'bg-indigo-500/10 border-indigo-500/20',
      },
      {
        href: '/transfers/wife',
        icon: HeartHandshake,
        label: 'Transfer to Wife',
        description: 'Spouse allowance funding progress',
        iconClass: 'text-pink-400',
        bgClass: 'bg-pink-500/10 border-pink-500/20',
      },
    ],
  },
  {
    heading: 'App',
    items: [
      {
        href: '/todos',
        icon: CheckSquare,
        label: 'Todos',
        description: 'Personal tasks and reminders',
        iconClass: 'text-violet-400',
        bgClass: 'bg-violet-500/10 border-violet-500/20',
      },
      {
        href: '/settings/financial',
        icon: Settings,
        label: 'Financial Settings',
        description: 'Monthly net income and salary day',
        iconClass: 'text-slate-400',
        bgClass: 'bg-slate-800 border-slate-700',
      },
    ],
  },
]

export default function MorePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">More</h1>
            <p className="text-sm text-slate-400 mt-0.5">Commitments, instalments, cards &amp; settings.</p>
          </div>
          <LogoutButton />
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.heading}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 px-1">
                {section.heading}
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
                {section.items.map(({ href, icon: Icon, label, description, iconClass, bgClass }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-800/50 active:bg-slate-800 transition-colors min-h-[60px]"
                  >
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${bgClass}`}>
                      <Icon className={`h-4.5 w-4.5 ${iconClass}`} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100">{label}</p>
                      <p className="text-xs text-slate-400 truncate">{description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 flex-shrink-0" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
