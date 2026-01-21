import { createFileRoute } from '@tanstack/react-router'
import Vehicles from '@/features/admin/vehicles'

export const Route = createFileRoute('/_authenticated/admin/vehicles/')({
  component: Vehicles,
})
