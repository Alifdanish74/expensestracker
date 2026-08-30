import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import { BottomNav } from '@/components/bottom-nav'
import { ensureProfile } from '@/features/profile/server/ensure-profile'
import { getTodos } from '@/features/todos/server/todo-service'
import { TodoFloatingWidget } from '@/features/todos/components/todo-floating-widget'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verifies Supabase authentication and memoizes userId per request
  const userId = await getAuthenticatedUserId()

  // Ensure Profile row & default categories exist in PostgreSQL (fast-path)
  await ensureProfile(userId)

  // Fetch initial todos for the global floating widget
  const initialTodos = await getTodos()

  return (
    <>
      {children}
      <TodoFloatingWidget initialTodos={initialTodos} />
      <BottomNav />
    </>
  )
}




