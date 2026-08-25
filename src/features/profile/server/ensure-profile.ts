import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ensureDefaultCategories } from './ensure-default-categories'

/**
 * Ensures a Profile row exists in PostgreSQL linked 1:1 to the authenticated Supabase user.
 * Never accepts userId from frontend client inputs; derives identity strictly from verified server auth.
 */
export async function ensureProfile() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: No valid Supabase authentication session.')
  }

  const userId = user.id
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'

  // Profile.id is identical to Supabase auth.users.id
  const profile = await prisma.profile.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      fullName,
      currency: 'MYR',
    },
  })

  // Seed default categories for this user profile idempotently
  const categories = await ensureDefaultCategories(userId)

  return {
    profile,
    categories,
  }
}
