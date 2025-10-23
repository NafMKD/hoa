import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/admin/authenticated-layout'

export const Route = createFileRoute('/_authenticated/admin')({
  component: () => <AuthenticatedLayout allowedRoles={['admin']} />,
})
