import { z } from 'zod'

const amountRegex = /^\d+(\.\d{1,2})?$/

export const confirmPaymentAmountSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val.toString() : val.trim()))
    .refine((val) => amountRegex.test(val), {
      message: 'Amount must be a positive number with up to 2 decimal places.',
    })
    .refine((val) => parseFloat(val) > 0, {
      message: 'Amount must be greater than RM 0.00.',
    }),
})

export type ConfirmPaymentAmountInput = z.infer<typeof confirmPaymentAmountSchema>

export const markPaidSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  actualAmount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val.toString() : val.trim()))
    .refine((val) => amountRegex.test(val), {
      message: 'Amount must be a non-negative number with up to 2 decimal places.',
    })
    .refine((val) => parseFloat(val) >= 0, {
      message: 'Amount cannot be negative.',
    }),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required (YYYY-MM-DD).'),
})

export type MarkPaidInput = z.infer<typeof markPaidSchema>

export const partialPaymentSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val.toString() : val.trim()))
    .refine((val) => amountRegex.test(val), {
      message: 'Payment amount must be a positive number with up to 2 decimal places.',
    })
    .refine((val) => parseFloat(val) > 0, {
      message: 'Payment amount must be greater than RM 0.00.',
    }),
})

export type PartialPaymentInput = z.infer<typeof partialPaymentSchema>
