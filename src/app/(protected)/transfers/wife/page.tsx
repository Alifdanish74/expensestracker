import { parseMonthParam } from '@/features/payments/utils/parse-month'
import { getAccounts } from '@/features/accounts/server/account-service'
import { getWifeTransferSummary } from '@/features/wife-transfers/server/wife-transfer-service'
import { WifeTransferView } from '@/features/wife-transfers/components/wife-transfer-view'

export const metadata = {
  title: 'Transfer to Wife — Expense Tracker',
  description: 'Track monthly funding sent to wife for recurring obligations.',
}

interface WifeTransferPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function WifeTransferPage({ searchParams }: WifeTransferPageProps) {
  const { month: monthParam = '' } = await searchParams

  const now = new Date()
  const parsed = parseMonthParam(monthParam)
  const year = parsed?.year ?? now.getFullYear()
  const month = parsed?.month ?? now.getMonth() + 1

  let summary: Awaited<ReturnType<typeof getWifeTransferSummary>> | null = null
  let loadError: string | null = null

  try {
    summary = await getWifeTransferSummary(year, month)
  } catch (err) {
    console.error('Failed to load wife transfer summary:', err)
    loadError = 'Unable to load wife transfer information.'
  }

  const rawAccounts = await getAccounts()
  const accounts = rawAccounts.map((a) => ({
    id: a.id,
    name: a.name,
    institutionName: a.institutionName,
  }))

  if (loadError || !summary) {
    return (
      <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans p-6 flex items-center justify-center">
        <div
          role="alert"
          className="bg-slate-900 border border-rose-800/50 rounded-2xl p-6 text-center space-y-2 max-w-md w-full"
        >
          <p className="text-sm font-semibold text-rose-400">
            {loadError ?? 'Unable to load wife transfer information.'}
          </p>
          <p className="text-xs text-slate-500">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return <WifeTransferView summary={summary} accounts={accounts} />
}
