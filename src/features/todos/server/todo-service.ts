import 'server-only'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import { todoSchema, type TodoFormValues } from '../schemas/todo-schema'

// ── Date Helpers ──────────────────────────────────────────────────────────────

/**
 * Parses a YYYY-MM-DD string into a Date representing midnight UTC on that
 * calendar date. Consistent with the project-wide date handling strategy.
 */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!))
}

/**
 * Converts a Date stored as midnight UTC back to a YYYY-MM-DD string
 * without timezone shift.
 */
function toDateString(date: Date | null | undefined): string | null {
  if (!date) return null
  return date.toISOString().slice(0, 10)
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TodoItem {
  id: string
  title: string
  description: string | null
  /** YYYY-MM-DD string, or null if no due date set. */
  dueDate: string | null
  completed: boolean
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface TodosResult {
  active: TodoItem[]
  completed: TodoItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapToTodoItem(raw: {
  id: string
  title: string
  description: string | null
  dueDate: Date | null
  completed: boolean
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): TodoItem {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    dueDate: toDateString(raw.dueDate),
    completed: raw.completed,
    completedAt: raw.completedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

// ── Service Functions ─────────────────────────────────────────────────────────

/**
 * Returns all Todos for the authenticated user split into active + completed.
 *
 * Active ordering: dueDate ASC (nulls last via application sort), createdAt DESC.
 * Completed ordering: completedAt DESC, updatedAt DESC.
 *
 * Overdue status is NOT stored — it is derived at display time.
 */
export async function getTodos(): Promise<TodosResult> {
  const userId = await getAuthenticatedUserId()

  // Fetch active and completed in parallel
  const [rawActive, rawCompleted] = await Promise.all([
    prisma.todo.findMany({
      where: { userId, completed: false },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.todo.findMany({
      where: { userId, completed: true },
      orderBy: [{ completedAt: 'desc' }, { updatedAt: 'desc' }],
    }),
  ])

  const active: TodoItem[] = rawActive
    .map(mapToTodoItem)
    // Sort: items with a due date first (by dueDate ASC), no-date items after (by createdAt DESC)
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      if (a.dueDate && !b.dueDate) return -1
      if (!a.dueDate && b.dueDate) return 1
      // Both null: preserve original createdAt DESC order
      return 0
    })

  const completed = rawCompleted.map(mapToTodoItem)

  return { active, completed }
}

/**
 * Returns a single Todo by id, scoped to the authenticated user.
 * Returns null if not found or owned by another user.
 */
export async function getTodoById(id: string): Promise<TodoItem | null> {
  const userId = await getAuthenticatedUserId()

  const raw = await prisma.todo.findFirst({
    where: { id, userId },
  })

  if (!raw) return null
  return mapToTodoItem(raw)
}

/**
 * Creates a new active Todo for the authenticated user.
 * Never accepts userId/completed/completedAt from the caller.
 */
export async function createTodo(input: TodoFormValues): Promise<void> {
  const userId = await getAuthenticatedUserId()

  const validated = todoSchema.safeParse(input)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid todo data')
  }

  const { title, description, dueDate } = validated.data
  const cleanDescription = description && description.trim() !== '' ? description.trim() : null
  const cleanDueDate = dueDate && dueDate.trim() !== '' ? parseDateString(dueDate) : null

  await prisma.todo.create({
    data: {
      userId,
      title: title.trim(),
      description: cleanDescription,
      dueDate: cleanDueDate,
      completed: false,
      completedAt: null,
    },
  })

  revalidatePath('/todos')
}

/**
 * Updates the editable fields (title, description, dueDate) of a Todo.
 * Preserves completed and completedAt — editing never changes completion state.
 * Verifies ownership before updating.
 */
export async function updateTodo(id: string, input: TodoFormValues): Promise<void> {
  const userId = await getAuthenticatedUserId()

  const validated = todoSchema.safeParse(input)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid todo data')
  }

  // Verify ownership
  const existing = await prisma.todo.findFirst({
    where: { id, userId },
    select: { id: true },
  })
  if (!existing) {
    throw new Error('Todo not found or access denied')
  }

  const { title, description, dueDate } = validated.data
  const cleanDescription = description && description.trim() !== '' ? description.trim() : null
  const cleanDueDate = dueDate && dueDate.trim() !== '' ? parseDateString(dueDate) : null

  await prisma.todo.update({
    where: { id },
    data: {
      title: title.trim(),
      description: cleanDescription,
      dueDate: cleanDueDate,
      // completed and completedAt are intentionally NOT updated here
    },
  })

  revalidatePath('/todos')
}

/**
 * Sets a Todo's completion state to the given targetCompleted value.
 * Uses target-state semantics (not blind toggle) to prevent race conditions.
 *
 * false → true: sets completed=true, completedAt=now
 * true → false: sets completed=false, completedAt=null
 * Already equal to target: no-op (idempotent — completedAt is preserved)
 *
 * Verifies ownership before updating.
 */
export async function setTodoCompleted(id: string, targetCompleted: boolean): Promise<void> {
  const userId = await getAuthenticatedUserId()

  const existing = await prisma.todo.findFirst({
    where: { id, userId },
    select: { id: true, completed: true, completedAt: true },
  })
  if (!existing) {
    throw new Error('Todo not found or access denied')
  }

  // Idempotency: no-op if already at target state
  if (existing.completed === targetCompleted) {
    return
  }

  const data =
    targetCompleted
      ? { completed: true, completedAt: new Date() }
      : { completed: false, completedAt: null }

  await prisma.todo.update({
    where: { id },
    data,
  })

  revalidatePath('/todos')
}

/**
 * Hard-deletes a Todo after verifying ownership.
 * No financial records are affected.
 */
export async function deleteTodo(id: string): Promise<void> {
  const userId = await getAuthenticatedUserId()

  const existing = await prisma.todo.findFirst({
    where: { id, userId },
    select: { id: true },
  })
  if (!existing) {
    throw new Error('Todo not found or access denied')
  }

  await prisma.todo.delete({ where: { id } })

  revalidatePath('/todos')
}
