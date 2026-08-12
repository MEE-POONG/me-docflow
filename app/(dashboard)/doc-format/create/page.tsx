import { PrismaClient } from '@prisma/client'
import CreateTemplateForm from './CreateTemplateForm'

const prisma = new PrismaClient()

export default async function CreateTemplatePage() {
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
      />
    </div>
  )
}
