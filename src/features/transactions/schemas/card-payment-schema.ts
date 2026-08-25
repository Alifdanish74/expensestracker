import { z } from 'zod'

export const cardPaymentSchema = z.object({
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

  /** Source account (must NOT be CREDIT_CARD). Validated server-side. */
  accountId: z.string().uuid('Please select a source account'),

  /** Destination credit card account (must be CREDIT_CARD). Validated server-side. */
  destinationAccountId: z.string().uuid('Please select a credit card'),

  transactionDate: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),

  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
})

export type CardPaymentFormValues = z.infer<typeof cardPaymentSchema>
