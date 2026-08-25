'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleLogout = async () => {
    if (loading || isPending) return
    setLoading(true)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      startTransition(() => {
        router.push('/login')
        router.refresh()
      })
    } catch {
      setLoading(false)
    }
  }

  const isSubmitting = loading || isPending

  return (
    <button
      onClick={handleLogout}
      disabled={isSubmitting}
      className={
        className ||
        'px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-all disabled:opacity-50 flex items-center space-x-2'
      }
    >
      {isSubmitting ? (
        <>
          <svg
            className="animate-spin h-3.5 w-3.5 text-slate-300"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Signing out...</span>
        </>
      ) : (
        <span>Sign Out</span>
      )}
    </button>
  )
}
