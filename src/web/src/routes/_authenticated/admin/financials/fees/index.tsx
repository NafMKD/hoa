import { createFileRoute } from '@tanstack/react-router'
import { Fees } from '@/features/admin/fees'

export const Route = createFileRoute('/_authenticated/admin/financials/fees/')({
  component: Fees,
})
