import { notFound } from 'next/navigation'
import { getCreditCardById } from '@/features/credit-cards/server/credit-card-service'
import { getStatementById } from '@/features/credit-cards/server/credit-card-statement-service'
import { StatementForm } from '@/features/credit-cards/components/statement-form'

interface EditStatementPageProps {
  params: Promise<{ accountId: string; statementId: string }>
}

export async function generateMetadata({ params }: EditStatementPageProps) {
  const { accountId, statementId } = await params
  const statement = await getStatementById(accountId, statementId)
  if (!statement) return { title: 'Statement Not Found — Expense Tracker' }
  return {
    title: `Edit Statement — ${statement.account.name}`,
    description: `Edit statement for ${statement.account.name}.`,
  }
}

export default async function EditStatementPage({ params }: EditStatementPageProps) {
  const { accountId, statementId } = await params

  const [card, statement] = await Promise.all([
    getCreditCardById(accountId),
    getStatementById(accountId, statementId),
  ])

  if (!card || !statement || statement.accountId !== card.id) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">
        <StatementForm card={card} initialData={statement} mode="edit" />
      </div>
    </div>
  )
}
