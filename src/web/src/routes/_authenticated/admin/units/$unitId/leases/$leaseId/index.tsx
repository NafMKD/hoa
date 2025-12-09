import { UnitLeaseDetail } from '@/features/admin/units/unit-lease-detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/admin/units/$unitId/leases/$leaseId/',
)({
  component: UnitLeaseDetail,
})

