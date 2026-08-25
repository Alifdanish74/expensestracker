import { z } from 'zod'

export const todoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(150, 'Title must be at most 150 characters'),

  description: z
    .string()
    .max(1500, 'Notes must be at most 1500 characters')
    .optional()
    .or(z.literal('')),

  /**
   * Optional YYYY-MM-DD string. Empty string treated as null (no due date).
   * Validated against ISO date format if present.
   */
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
})

export type TodoFormValues = z.infer<typeof todoSchema>
