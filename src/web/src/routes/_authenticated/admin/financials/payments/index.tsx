import { createFileRoute } from '@tanstack/react-router'
import { Payments } from '@/features/admin/payments'

export const Route = createFileRoute('/_authenticated/admin/financials/payments/')({
  component: Payments,
})
