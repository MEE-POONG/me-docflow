import { connection } from 'next/server'
import { prisma } from '@/lib/prisma'
import CreateTemplateForm from './CreateTemplateForm'

export default async function CreateTemplatePage() {
  await connection()

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
