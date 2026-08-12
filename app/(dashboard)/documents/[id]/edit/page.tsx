import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'
import CreateDocumentForm from '../../create/CreateDocumentForm'

const prisma = new PrismaClient()

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const documentId = resolvedParams.id;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { 
      category: true,
      documentType: true,
      template: true
    }
  })

  if (!document) notFound()

  const folders = [
    { id: '1', name: 'งานเอกสารทั่วไป' },
    { id: '2', name: 'เอกสารบัญชี' }
  ]

  const tags = [
    { id: '1', name: 'ด่วน' },
    { id: '2', name: 'รออนุมัติ' }
  ]

  const [categories, types, templates, company] = await Promise.all([
    prisma.documentCategory.findMany({ orderBy: { showOrder: 'asc' } }),
    prisma.documentType.findMany({ orderBy: { showOrder: 'asc' } }),
    prisma.documentTemplate.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.company.findFirst()
  ])

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <CreateDocumentForm
        folders={folders}
        tags={tags}
        categories={categories}
        documentTypes={types}
        templates={templates}
        company={company}
        initialData={document}
      />
    </div>
  )
}
