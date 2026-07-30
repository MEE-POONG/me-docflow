import { PrismaClient } from '@prisma/client'
import CreateDocumentForm from './CreateDocumentForm'

const prisma = new PrismaClient()

export default async function CreateDocumentPage() {
  // Mock data for folders and tags since they are not in schema yet
  const folders = [
    { id: '1', name: 'งานเอกสารทั่วไป' },
    { id: '2', name: 'เอกสารบัญชี' }
  ]

  const tags = [
    { id: '1', name: 'ด่วน' },
    { id: '2', name: 'รออนุมัติ' }
  ]

  const categories = await prisma.documentCategory.findMany({
    orderBy: { showOrder: 'asc' }
  })

  const types = await prisma.documentType.findMany({
    orderBy: { showOrder: 'asc' }
  })

  const templates = await prisma.documentTemplate.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-6">
      <CreateDocumentForm
        folders={folders}
        tags={tags}
        categories={categories}
        documentTypes={types}
        templates={templates}
      />
    </div>
  )
}
