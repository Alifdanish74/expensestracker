import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import { ensureDefaultCategories } from './ensure-default-categories'

/**
 * Ensures a Profile row exists in PostgreSQL linked 1:1 to the authenticated Supabase user.
 * Fast-path: checks indexed profile existence first. Only performs upsert and category seeding
 * if the user profile or categories are uninitialized.
 */
export async function ensureProfile(inputUserId?: string) {
  const userId = inputUserId ?? (await getAuthenticatedUserId())

  // Fast-path: Existing profiles with categories return immediately in a single fast DB query
  const existing = await prisma.profile.findUnique({
    where: { id: userId },
    select: {
      id: true,
      categories: { select: { id: true }, take: 1 },
    },
  })

  if (existing && existing.categories.length > 0) {
    return
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
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

