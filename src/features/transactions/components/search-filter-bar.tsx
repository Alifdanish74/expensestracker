'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterOption {
  id: string
  name: string
}

interface SearchFilterBarProps {
  currentMonth: string
  currentSearch: string
  currentAccountId: string
  currentCategoryId: string
  currentType: string
  accounts: FilterOption[]
  categories: FilterOption[]
}

const TRANSACTION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'EXPENSE', label: 'Expenses' },
  { value: 'INCOME', label: 'Income' },
  { value: 'TRANSFER', label: 'Transfers' },
  { value: 'CARD_PAYMENT', label: 'Card Payments' },
  { value: 'REFUND', label: 'Refunds' },
]

const selectClass =
  'flex-1 min-w-0 appearance-none bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer min-h-[44px]'

/**
 * SearchFilterBar — client component for search + account/category/type filter controls.
 *
 * Important: the parent page must render this with key={currentSearch} so that
 * React remounts the component (resetting local search state) when the URL search
 * param changes externally (e.g. Clear Filters, browser back).
 */
export function SearchFilterBar({
  currentMonth,
  currentSearch,
  currentAccountId,
  currentCategoryId,
  currentType,
  accounts,
  categories,
}: SearchFilterBarProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(currentSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    params.set('month', currentMonth)

    const search = overrides.q !== undefined ? overrides.q : searchValue
    const accountId = overrides.account !== undefined ? overrides.account : currentAccountId
    const categoryId = overrides.category !== undefined ? overrides.category : currentCategoryId
    const type = overrides.type !== undefined ? overrides.type : currentType

    if (search.trim()) params.set('q', search.trim())
    if (accountId) params.set('account', accountId)
    if (categoryId) params.set('category', categoryId)
    if (type) params.set('type', type)

    return `/transactions?${params.toString()}`
  }

  function handleSearchChange(value: string) {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: value }))
    }, 350)
  }

  function handleAccountChange(value: string) {
    router.push(buildUrl({ account: value }))
  }

  function handleCategoryChange(value: string) {
    router.push(buildUrl({ category: value }))
  }

  function handleTypeChange(value: string) {
    router.push(buildUrl({ type: value }))
  }

  function handleClearSearch() {
    setSearchValue('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.push(buildUrl({ q: '' }))
  }

  const isFiltered = !!(searchValue.trim() || currentAccountId || currentCategoryId || currentType)

  function handleClearAll() {
    setSearchValue('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.push(`/transactions?month=${currentMonth}`)
  }

  return (
    <div className="space-y-2.5">
      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search transactions"
          aria-label="Search transactions"
          className="w-full pl-10 pr-9 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all min-h-[44px]"
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClearSearch}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Type filter */}
      <select
        value={currentType}
        onChange={(e) => handleTypeChange(e.target.value)}
        aria-label="Filter by type"
        className={cn(selectClass, 'w-full')}
      >
        {TRANSACTION_TYPES.map((t) => (
          <option key={t.value} value={t.value} className="bg-slate-800">
            {t.label}
          </option>
        ))}
      </select>

      {/* Account + Category filter row */}
      <div className="flex gap-2">
        <select
          value={currentAccountId}
          onChange={(e) => handleAccountChange(e.target.value)}
          aria-label="Filter by account"
          className={selectClass}
        >
          <option value="">All Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id} className="bg-slate-800">
              {a.name}
            </option>
          ))}
        </select>

        <select
          value={currentCategoryId}
          onChange={(e) => handleCategoryChange(e.target.value)}
          aria-label="Filter by category"
          className={selectClass}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-slate-800">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Active filter indicator + clear all */}
      {isFiltered && (
        <div className="flex items-center justify-between px-0.5">
          <p className="text-xs text-slate-500">Filters active</p>
          <button
            type="button"
            onClick={handleClearAll}
            className={cn(
              'text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors',
              'min-h-[32px] px-2'
            )}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  )
}
