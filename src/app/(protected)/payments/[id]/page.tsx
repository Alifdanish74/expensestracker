import { notFound } from 'next/navigation'
import { getMonthlyPaymentById } from '@/features/payments/server/monthly-payment-service'
import { PaymentDetailView } from '@/features/payments/components/payment-detail-view'

export const metadata = {
  title: 'Payment Detail — Expense Tracker',
  description: 'View and manage monthly payment snapshot details.',
}

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  let payment: Awaited<ReturnType<typeof getMonthlyPaymentById>> | null = null

  try {
    payment = await getMonthlyPaymentById(id)
  } catch (err) {
    console.error('Error fetching monthly payment by ID:', err)
    notFound()
  }

  if (!payment) {
    notFound()
  }

  return <PaymentDetailView payment={payment} />
}
