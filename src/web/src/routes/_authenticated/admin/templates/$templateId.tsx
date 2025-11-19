import { DocumentTemplateDetail } from '@/features/admin/templates/template-detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/templates/$templateId')({
  component: DocumentTemplateDetail,
})
