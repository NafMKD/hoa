import { Leases } from '@/features/admin/units/lease'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/units/$unitId/leases/')({
  component: Leases,
})

