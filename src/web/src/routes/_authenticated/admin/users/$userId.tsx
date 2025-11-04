import { UserDetail } from '@/features/admin/users/user-detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/users/$userId')({
  component: UserDetail,
})
