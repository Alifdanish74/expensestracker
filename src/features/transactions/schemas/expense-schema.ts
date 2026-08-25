import { z } from 'zod'

export const expenseSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => {
      const n = parseFloat(v)
      return !isNaN(n) && n > 0
    }, 'Amount must be greater than zero'),

  description: z
    .string()
    .min(1, 'Description is required')
    .max(150, 'Description must be at most 150 characters'),

  categoryId: z.string().uuid('Please select a valid category'),

  accountId: z.string().uuid('Please select a valid account'),

  transactionDate: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),

  essential: z.boolean(),

  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>
