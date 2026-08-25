import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase server client for Server Components, Server Actions, and Route Handlers.
 * In Next.js 15+, `cookies()` returns a Promise that must be awaited.
 * Setting cookies inside Server Components throws an error; the try-catch block handles this case,
 * relying on middleware (updateSession) to perform session mutation and cookie persistence.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be safely ignored if middleware is refreshing user sessions.
          }
        },
      },
    }
  )
}
