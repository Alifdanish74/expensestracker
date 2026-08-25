import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAccountById } from '@/features/accounts/server/account-service'
import { AccountForm } from '@/features/accounts/components/account-form'
import { updateAccountAction } from '@/features/accounts/server/account-actions'
import type { AccountFormValues } from '@/features/accounts/schemas/account-schema'

interface EditAccountPageProps {
  params: Promise<{ id: string }>
}

export default async function EditAccountPage({ params }: EditAccountPageProps) {
  const { id } = await params
  const account = await getAccountById(id)

  if (!account) {
    notFound()
  }

  // Bind the account ID into the update action so the client form doesn't need to pass it
  const boundUpdateAction = async (values: AccountFormValues) => {
    'use server'
    return updateAccountAction(id, values)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">
        {/* Top bar */}
        <Link
          href={`/accounts/${id}`}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm mb-6 min-h-[44px] -ml-1 px-1 w-fit"
          aria-label="Back to account"
        >
          <ArrowLeft className="h-4 w-4" />
          {account.name}
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">Edit Account</h1>
          <p className="text-sm text-slate-400 mt-1">{account.name}</p>
        </div>

        {/* Form card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <AccountForm
            initialData={account}
            onSubmit={boundUpdateAction}
            submitLabel="Save Changes"
          />
        </div>
      </div>
    </div>
  )
}
