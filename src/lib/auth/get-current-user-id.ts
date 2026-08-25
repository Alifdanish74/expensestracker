import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns the verified Supabase user ID for the current request context.
 * Always derive ownership from this server-verified session ID rather than browser inputs.
 * Redirects to /login if no valid authenticated user session exists.
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return user.id
}

