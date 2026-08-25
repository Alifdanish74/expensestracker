import { z } from 'zod'

export const creditCardStatementSchema = z
  .object({
    statementYear: z
      .number({ message: 'Statement year must be a number' })
      .int('Year must be an integer')
      .min(1900, 'Invalid year')
      .max(2100, 'Invalid year'),
    statementMonth: z
      .number({ message: 'Statement month must be a number' })
      .int('Month must be an integer')
      .min(1, 'Month must be between 1 and 12')
      .max(12, 'Month must be between 1 and 12'),
    statementDate: z
      .string()
      .min(1, 'Statement date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Statement date must be in YYYY-MM-DD format'),
    dueDate: z
      .string()
      .min(1, 'Due date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
    statementBalance: z
      .string()
      .min(1, 'Statement balance is required')
      .refine(
        (val) => !isNaN(parseFloat(val)),
        'Statement balance must be a valid number'
      )
      .refine(
        (val) => /^-?\d+(\.\d{1,2})?$/.test(val.trim()),
        'Balance can have at most 2 decimal places'
      ),
    minimumPayment: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          const num = parseFloat(val)
          return !isNaN(num) && num >= 0
        },
        'Minimum payment must be greater than or equal to 0'
      )
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          return /^\d+(\.\d{1,2})?$/.test(val.trim())
        },
        'Minimum payment can have at most 2 decimal places'
      ),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  })
  .refine(
    (data) => {
      const stmt = new Date(data.statementDate)
      const due = new Date(data.dueDate)
      return due >= stmt
    },
    {
      message: 'Due date cannot be earlier than statement date',
      path: ['dueDate'],
    }
  )

export type CreditCardStatementInput = z.infer<typeof creditCardStatementSchema>
