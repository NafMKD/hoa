import { createFileRoute } from '@tanstack/react-router'
import { Reconciliation } from '@/features/admin/reconciliation'

export const Route = createFileRoute('/_authenticated/admin/financials/reconciliation/')({
  component: Reconciliation,
})
