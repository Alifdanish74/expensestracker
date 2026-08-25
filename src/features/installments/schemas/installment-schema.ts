import { z } from 'zod'

export const installmentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(150, 'Name must be at most 150 characters'),

    monthlyAmount: z
      .string()
      .min(1, 'Monthly amount is required')
      .refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num > 0
      }, 'Monthly amount must be greater than zero')
      .refine((val) => {
        return /^\d+(\.\d{1,2})?$/.test(val)
      }, 'Monthly amount can have at most 2 decimal places'),

    categoryId: z.string().uuid('Please select a valid category'),

    accountId: z.string().optional().or(z.literal('')),

    // UI validation requires >= 1 during create/edit of active instalments.
    // The database allows 0 so that future MonthlyPayment integration can
    // programmatically decrement to zero when all payments are completed.
    remainingPayments: z
      .union([z.number(), z.string()])
      .refine((val) => {
        const n = typeof val === 'number' ? val : parseInt(String(val), 10)
        return !isNaN(n) && Number.isInteger(n) && n >= 1
      }, 'Payments remaining must be at least 1'),

    // Optional: set only when the original total term is known.
    // Leave blank if you only know how many payments remain.
    totalPayments: z
      .union([z.number(), z.string()])
      .optional()
      .or(z.literal('')),

    dueDay: z
      .union([z.number(), z.string()])
      .refine((val) => {
        const n = typeof val === 'number' ? val : parseInt(String(val), 10)
        return !isNaN(n) && Number.isInteger(n) && n >= 1 && n <= 31
      }, 'Due day must be an integer between 1 and 31'),

    startDate: z
      .string()
      .min(1, 'Tracking start date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),

    notes: z
      .string()
      .max(500, 'Notes must be at most 500 characters')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      // Validate totalPayments only when a value is supplied
      const raw = data.totalPayments
      if (raw === undefined || raw === '' || raw === null) return true
      const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10)
      return !isNaN(n) && n >= 1
    },
    {
      message: 'Total payments must be at least 1 if provided',
      path: ['totalPayments'],
    }
  )
  .refine(
    (data) => {
      // totalPayments must be >= remainingPayments when both are set
      const rawTotal = data.totalPayments
      if (rawTotal === undefined || rawTotal === '' || rawTotal === null) return true
      const total = typeof rawTotal === 'number' ? rawTotal : parseInt(String(rawTotal), 10)
      const remaining =
        typeof data.remainingPayments === 'number'
          ? data.remainingPayments
          : parseInt(String(data.remainingPayments), 10)
      if (isNaN(total) || isNaN(remaining)) return true
      return total >= remaining
    },
    {
      message: 'Total payments cannot be less than payments remaining',
      path: ['totalPayments'],
    }
  )

export type InstallmentFormValues = z.infer<typeof installmentSchema>
