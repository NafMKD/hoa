import { createFileRoute } from '@tanstack/react-router'
import { BatchDetail } from '@/features/admin/reconciliation/batch-detail'

export const Route = createFileRoute('/_authenticated/admin/financials/reconciliation/$batchId')({
  component: BatchDetail,
})
