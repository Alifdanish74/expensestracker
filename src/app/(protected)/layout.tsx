import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import { BottomNav } from '@/components/bottom-nav'
import { ensureProfile } from '@/features/profile/server/ensure-profile'
import { getTodos, type TodosResult } from '@/features/todos/server/todo-service'
import { TodoFloatingWidget } from '@/features/todos/components/todo-floating-widget'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verifies Supabase authentication and memoizes userId per request
  const userId = await getAuthenticatedUserId()

  // Ensure Profile row & default categories exist in PostgreSQL (fast-path)
  try {
    await ensureProfile(userId)
  } catch (err) {
    console.error('Failed to ensure profile in ProtectedLayout:', err)
  }

  // Fetch initial todos for the global floating widget
  let initialTodos: TodosResult = { active: [], completed: [] }
  try {
    initialTodos = await getTodos()
  } catch (err) {
    console.error('Failed to fetch initial todos in ProtectedLayout:', err)
  }

  return (
    <>
      {children}
      <TodoFloatingWidget initialTodos={initialTodos} />
      <BottomNav />
    </>
  )
}




