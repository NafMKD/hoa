import { VehicleDetail } from '@/features/admin/vehicles/vehicle-detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/vehicles/$vehicleId')({
  component: VehicleDetail,
})
