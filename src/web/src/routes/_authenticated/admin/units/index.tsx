import { createFileRoute } from '@tanstack/react-router'
import { Units } from '@/features/admin/units'

export const Route = createFileRoute('/_authenticated/admin/units/')({
  component: Units,
})
