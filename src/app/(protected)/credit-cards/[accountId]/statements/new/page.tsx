import { notFound } from 'next/navigation'
import { getCreditCardById } from '@/features/credit-cards/server/credit-card-service'
import { StatementForm } from '@/features/credit-cards/components/statement-form'

interface RecordStatementPageProps {
  params: Promise<{ accountId: string }>
}

export async function generateMetadata({ params }: RecordStatementPageProps) {
  const { accountId } = await params
  const card = await getCreditCardById(accountId)
  if (!card) return { title: 'Card Not Found — Expense Tracker' }
  return {
    title: `Record Statement — ${card.name}`,
    description: `Record historical statement for ${card.name}.`,
  }
}

export default async function RecordStatementPage({ params }: RecordStatementPageProps) {
  const { accountId } = await params

  const card = await getCreditCardById(accountId)
  if (!card) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">
        <StatementForm card={card} mode="create" />
      </div>
    </div>
  )
}
