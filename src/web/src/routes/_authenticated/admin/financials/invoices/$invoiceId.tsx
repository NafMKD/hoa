import { InvoiceDetail } from '@/features/admin/invoices/invoice-detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/financials/invoices/$invoiceId')({
  component: InvoiceDetail,
})
