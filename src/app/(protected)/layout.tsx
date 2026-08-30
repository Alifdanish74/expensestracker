import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import { BottomNav } from '@/components/bottom-nav'
import { ensureProfile } from '@/features/profile/server/ensure-profile'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verifies Supabase authentication and memoizes userId per request
  const userId = await getAuthenticatedUserId()

  // Ensure Profile row & default categories exist in PostgreSQL (fast-path)
  await ensureProfile(userId)

  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}



