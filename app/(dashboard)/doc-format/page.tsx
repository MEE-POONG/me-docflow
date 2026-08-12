import { PrismaClient } from '@prisma/client'
import TemplatesList from './TemplatesList'

const prisma = new PrismaClient()

export default async function TemplatesPage() {
  const templates = await prisma.documentTemplate.findMany({
    include: {
      category: true,
      documentType: true,
      createdByUser: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return <TemplatesList initialTemplates={templates} />
}
