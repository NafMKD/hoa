import { createFileRoute } from '@tanstack/react-router'
import { DocumentTemplates } from '@/features/admin/templates'

export const Route = createFileRoute('/_authenticated/admin/templates/')({
  component: DocumentTemplates,
})
