import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns the verified Supabase user ID for the current request context.
 * Wrapped in React cache() so multiple calls during a single request (RSC or action)
 * execute the underlying Supabase Auth check ONCE and return the memoized ID instantly.
 */
export const getAuthenticatedUserId = cache(async (): Promise<string> => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return user.id
})


