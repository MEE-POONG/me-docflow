import { PrismaClient } from '@prisma/client'
import TemplatesList from './TemplatesList'

const prisma = new PrismaClient()

export default async function TemplatesPage() {
  const [templates, categories, documentTypes] = await Promise.all([
    prisma.documentTemplate.findMany({
      include: {
        category: true,
        documentType: true,
        createdByUser: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.documentCategory.findMany({ where: { isActive: true }, orderBy: { showOrder: 'asc' }, select: { id: true, name: true } }),
    prisma.documentType.findMany({ where: { isActive: true }, orderBy: { showOrder: 'asc' }, select: { id: true, name: true, categoryId: true } }),
  ])

  return <TemplatesList initialTemplates={templates} categories={categories} documentTypes={documentTypes} />
}
