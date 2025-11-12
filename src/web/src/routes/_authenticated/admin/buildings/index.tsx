import { createFileRoute } from '@tanstack/react-router'
import { Buildings } from '@/features/admin/buildings'

export const Route = createFileRoute('/_authenticated/admin/buildings/')({
  component: Buildings,
})
