import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/features/admin/users'

export const Route = createFileRoute('/_authenticated/admin/users/')({
  component: Users,
})
