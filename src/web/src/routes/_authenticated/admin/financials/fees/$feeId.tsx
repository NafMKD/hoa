import { FeeDetail } from '@/features/admin/fees/fee-detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/financials/fees/$feeId')({
  component: FeeDetail,
})
