import { prisma } from '@/lib/prisma'
import type { Category } from '@/generated/prisma/client'

export const DEFAULT_CATEGORIES = [
  { name: 'Housing', essentialDefault: true },
  { name: 'Utilities', essentialDefault: true },
  { name: 'Transport', essentialDefault: true },
  { name: 'Insurance & Medical', essentialDefault: true },
  { name: 'Groceries', essentialDefault: true },
  { name: 'Food & Dining', essentialDefault: false },
  { name: 'Lifestyle', essentialDefault: false },
  { name: 'Financial', essentialDefault: true },
  { name: 'Shopping', essentialDefault: false },
  { name: 'Family', essentialDefault: true },
  { name: 'Savings', essentialDefault: true },
  { name: 'Other', essentialDefault: false },
]

/**
 * Idempotently seeds default expense categories for the given user profile ID.
 */
export async function ensureDefaultCategories(userId: string): Promise<Category[]> {
  const existingCategories = await prisma.category.findMany({
    where: { userId },
    select: { name: true },
  })

  const existingNames = new Set(existingCategories.map((c: { name: string }) => c.name))
  const missingCategories = DEFAULT_CATEGORIES.filter(
    (cat) => !existingNames.has(cat.name)
  )

  if (missingCategories.length > 0) {
    await prisma.category.createMany({
      data: missingCategories.map((cat) => ({
        userId,
        name: cat.name,
        essentialDefault: cat.essentialDefault,
        active: true,
      })),
      skipDuplicates: true,
    })
  }

  return await prisma.category.findMany({
    where: { userId, active: true },
    orderBy: { name: 'asc' },
  })
}
