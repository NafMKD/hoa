import { BuildingDetail } from '@/features/admin/buildings/building-detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/buildings/$buildingId')({
  component: BuildingDetail,
})
