'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth/get-current-user-id'
import { financialSettingsSchema } from '../schemas/financial-settings-schema'

export interface FinancialSettingsData {
  /** Serialised Decimal string, or null if not configured */
  monthlyNetIncome: string | null
  salaryDay: number | null
}

export type FinancialSettingsActionResult =
  | { success: true }
  | { success: false; error: string }

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Returns the authenticated user's current financial settings.
 * monthlyNetIncome is serialised to string to safely cross the RSC→Client boundary.
 */
export async function getFinancialSettings(): Promise<FinancialSettingsData> {
  const userId = await getAuthenticatedUserId()

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { monthlyNetIncome: true, salaryDay: true },
  })

  return {
    monthlyNetIncome: profile?.monthlyNetIncome?.toString() ?? null,
    salaryDay: profile?.salaryDay ?? null,
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Updates the authenticated user's financial settings.
 *
 * Security:
 *  - userId derived server-side from Supabase session — never from client input
 *  - Profile updated only where id = authenticatedUserId
 *  - Revalidates /dashboard and /settings/financial
 */
export async function updateFinancialSettings(
  rawInput: { monthlyNetIncome: string; salaryDay: string }
): Promise<FinancialSettingsActionResult> {
  try {
    const userId = await getAuthenticatedUserId()

    const parsed = financialSettingsSchema.safeParse(rawInput)
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return { success: false, error: firstIssue?.message ?? 'Invalid input' }
    }

    const { monthlyNetIncome, salaryDay } = parsed.data

    await prisma.profile.update({
      where: { id: userId },
      data: {
        monthlyNetIncome:
          monthlyNetIncome !== null ? parseFloat(monthlyNetIncome) : null,
        salaryDay: salaryDay !== null ? parseInt(salaryDay, 10) : null,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/settings/financial')

    return { success: true }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to save settings. Please try again.'
    return { success: false, error: message }
  }
}
