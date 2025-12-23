import { PaymentDetail } from '@/features/admin/payments/payment-detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/financials/payments/$paymentId')({
  component: PaymentDetail,
})
