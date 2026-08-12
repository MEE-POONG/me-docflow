import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'
import CreateTemplateForm from '../../create/CreateTemplateForm'

const prisma = new PrismaClient()

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const templateId = resolvedParams.id;
  
  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId }
  })
  
  if (!template) {
    notFound()
  }

  const categories = await prisma.documentCategory.findMany({
    orderBy: { showOrder: 'asc' }
  })
  
  const types = await prisma.documentType.findMany({
    orderBy: { showOrder: 'asc' }
  })

  return (
    <div className="p-6">
      <CreateTemplateForm 
        categories={categories}
        documentTypes={types}
        initialData={template}
      />
    </div>
  )
}
