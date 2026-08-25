import { z } from 'zod'

/**
 * Zod schema for updating financial settings.
 *
 * monthlyNetIncome — optional; if provided must be ≥ 0 with up to 2 decimal places.
 *                    null means "clear / not configured".
 * salaryDay       — optional; if provided must be an integer 1–31.
 */
export const financialSettingsSchema = z.object({
  monthlyNetIncome: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return null
      return val
    })
    .pipe(
      z
        .string()
        .nullable()
        .refine(
          (val) => {
            if (val === null) return true
            const n = parseFloat(val)
            return !isNaN(n) && n >= 0
          },
          { message: 'Monthly income must be 0 or greater' }
        )
        .refine(
          (val) => {
            if (val === null) return true
            // Allow up to 2 decimal places
            return /^\d+(\.\d{1,2})?$/.test(val)
          },
          { message: 'Monthly income must have at most 2 decimal places' }
        )
    ),

  salaryDay: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return null
      return val
    })
    .pipe(
      z
        .string()
        .nullable()
        .refine(
          (val) => {
            if (val === null) return true
            const n = parseInt(val, 10)
            return !isNaN(n) && n >= 1 && n <= 31 && String(n) === val.trim()
          },
          { message: 'Salary day must be a whole number between 1 and 31' }
        )
    ),
})

export type FinancialSettingsFormValues = {
  monthlyNetIncome: string
  salaryDay: string
}

export type FinancialSettingsInput = z.infer<typeof financialSettingsSchema>
