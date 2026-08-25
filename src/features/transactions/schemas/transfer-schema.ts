import { z } from 'zod'

export const transferSchema = z
  .object({
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

    /** Source account (non-CREDIT_CARD). Validated server-side. */
    accountId: z.string().uuid('Please select a source account'),

    /** Destination account (non-CREDIT_CARD). Validated server-side. */
    destinationAccountId: z.string().uuid('Please select a destination account'),

    transactionDate: z
      .string()
      .min(1, 'Date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),

    notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
  })
  .refine((data) => data.accountId !== data.destinationAccountId, {
    message: 'Source and destination accounts must be different',
    path: ['destinationAccountId'],
  })

export type TransferFormValues = z.infer<typeof transferSchema>
