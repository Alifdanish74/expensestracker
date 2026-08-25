import { z } from 'zod'

const amountRegex = /^\d+(\.\d{1,2})?$/

export const recordWifeTransferSchema = z.object({
  paymentYear: z.number().int().min(2000).max(2100),
  paymentMonth: z.number().int().min(1).max(12),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val.toString() : val.trim()))
    .refine((val) => amountRegex.test(val), {
      message: 'Amount must be a positive number with up to 2 decimal places.',
    })
    .refine((val) => parseFloat(val) > 0, {
      message: 'Transfer amount must be greater than RM 0.00.',
    }),
  transferDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required (YYYY-MM-DD).'),
  sourceAccountId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== '' ? val.trim() : null)),
  notes: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== '' ? val.trim() : null)),
})

export type RecordWifeTransferInput = z.infer<typeof recordWifeTransferSchema>
