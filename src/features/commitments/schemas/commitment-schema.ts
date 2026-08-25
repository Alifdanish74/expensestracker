import { z } from 'zod'

export const commitmentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(150, 'Name must be at most 150 characters'),

    defaultAmount: z
      .string()
      .min(1, 'Default amount is required')
      .refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0
      }, 'Default amount must be a non-negative number')
      .refine((val) => {
        return /^\d+(\.\d{1,2})?$/.test(val)
      }, 'Default amount can have at most 2 decimal places'),

    categoryId: z.string().uuid('Please select a valid category'),

    accountId: z.string().optional().or(z.literal('')),

    dueDay: z
      .union([z.number(), z.string()])
      .refine((val) => {
        const n = typeof val === 'number' ? val : parseInt(val, 10)
        return !isNaN(n) && Number.isInteger(n) && n >= 1 && n <= 31
      }, 'Due day must be an integer between 1 and 31'),

    variableAmount: z.boolean(),

    transferToWife: z.boolean(),

    startDate: z
      .string()
      .min(1, 'Start date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),

    endDate: z
      .string()
      .optional()
      .or(z.literal('')),

    notes: z
      .string()
      .max(500, 'Notes must be at most 500 characters')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate && data.endDate.trim() !== '') {
        return data.endDate >= data.startDate
      }
      return true
    },
    {
      message: 'End date cannot be earlier than start date',
      path: ['endDate'],
    }
  )

export type CommitmentFormValues = z.infer<typeof commitmentSchema>
