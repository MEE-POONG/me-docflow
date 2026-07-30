import { PrismaClient } from '@prisma/client'
import DocumentsList from './DocumentsList'

const prisma = new PrismaClient()

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    include: {
      createdBy: true,
      category: true,
      documentType: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  return <DocumentsList initialDocuments={documents} />
}
