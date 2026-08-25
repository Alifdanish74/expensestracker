import { z } from 'zod'

export const accountSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Account name is required')
      .max(100, 'Account name must be at most 100 characters'),

    institutionName: z
      .string()
      .max(100, 'Institution name must be at most 100 characters')
      .optional()
      .or(z.literal('')),

    type: z.enum(['BANK_ACCOUNT', 'CREDIT_CARD', 'E_WALLET', 'CASH', 'FINANCING'], {
      message: 'Please select a valid account type',
    }),

    lastFourDigits: z
      .string()
      .regex(/^\d{4}$/, 'Must be exactly 4 digits')
      .optional()
      .or(z.literal('')),

    currentBalance: z
      .string()
      .refine(
        (val) => val === '' || val === undefined || !isNaN(parseFloat(val)),
        'Current balance must be a valid number'
      )
      .optional()
      .or(z.literal('')),

    creditLimit: z
      .string()
      .refine(
        (val) => val === '' || val === undefined || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
        'Credit limit must be a positive number'
      )
      .optional()
      .or(z.literal('')),

    statementDay: z
      .string()
      .refine(
        (val) => {
          if (!val || val === '') return true
          const n = parseInt(val, 10)
          return !isNaN(n) && n >= 1 && n <= 31
        },
        'Statement day must be between 1 and 31'
      )
      .optional()
      .or(z.literal('')),

    dueDay: z
      .string()
      .refine(
        (val) => {
          if (!val || val === '') return true
          const n = parseInt(val, 10)
          return !isNaN(n) && n >= 1 && n <= 31
        },
        'Due day must be between 1 and 31'
      )
      .optional()
      .or(z.literal('')),
  })

export type AccountFormValues = z.infer<typeof accountSchema>

/** Transforms validated form values into Prisma-ready data. */
export function toAccountData(values: AccountFormValues) {
  const isCreditCard = values.type === 'CREDIT_CARD'
  const hasInstitution = ['BANK_ACCOUNT', 'CREDIT_CARD', 'E_WALLET', 'FINANCING'].includes(
    values.type
  )
  const hasDueDay = ['CREDIT_CARD', 'FINANCING'].includes(values.type)

  return {
    name: values.name.trim(),
    institutionName:
      hasInstitution && values.institutionName ? values.institutionName.trim() || null : null,
    type: values.type,
    lastFourDigits:
      isCreditCard && values.lastFourDigits ? values.lastFourDigits.trim() || null : null,
    currentBalance: values.currentBalance && values.currentBalance !== '' ? parseFloat(values.currentBalance) : 0,
    creditLimit:
      isCreditCard && values.creditLimit && values.creditLimit !== '' ? parseFloat(values.creditLimit) : null,
    statementDay:
      isCreditCard && values.statementDay && values.statementDay !== '' ? parseInt(values.statementDay, 10) : null,
    dueDay:
      hasDueDay && values.dueDay && values.dueDay !== '' ? parseInt(values.dueDay, 10) : null,
  }
}
