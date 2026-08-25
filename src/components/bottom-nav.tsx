'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  Banknote,
  Landmark,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    match: (path: string) => path === '/dashboard' || path.startsWith('/dashboard?'),
  },
  {
    href: '/transactions',
    label: 'Transactions',
    icon: Receipt,
    match: (path: string) => path.startsWith('/transactions'),
  },
  {
    href: '/payments',
    label: 'Payments',
    icon: Banknote,
    match: (path: string) => path.startsWith('/payments'),
  },
  {
    href: '/accounts',
    label: 'Accounts',
    icon: Landmark,
    match: (path: string) =>
      path.startsWith('/accounts') || path.startsWith('/credit-cards'),
  },
  {
    href: '/more',
    label: 'More',
    icon: MoreHorizontal,
    match: (path: string) =>
      path.startsWith('/more') ||
      path.startsWith('/commitments') ||
      path.startsWith('/installments') ||
      path.startsWith('/transfers') ||
      path.startsWith('/settings'),
  },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80"
      aria-label="Main navigation"
    >
      <div className="max-w-lg mx-auto flex items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] text-[10px] font-semibold tracking-wide transition-colors touch-manipulation select-none relative',
                isActive
                  ? 'text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300 active:text-slate-200'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-transform',
                  isActive && 'scale-110'
                )}
                aria-hidden="true"
              />
              <span className={cn(isActive && 'text-indigo-400')}>{label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-indigo-400 rounded-t-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
