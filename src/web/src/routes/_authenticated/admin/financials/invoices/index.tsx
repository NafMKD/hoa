import { createFileRoute } from '@tanstack/react-router'
import { Invoices } from '@/features/admin/invoices'

export const Route = createFileRoute('/_authenticated/admin/financials/invoices/')({
  component: Invoices,
})
