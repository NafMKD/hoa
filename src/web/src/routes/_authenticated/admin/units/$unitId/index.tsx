import { UnitDetail } from '@/features/admin/units/building-detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/units/$unitId/')({
  component: UnitDetail,
})
