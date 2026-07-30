'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function createDocument(formData: {
  title: string
  categoryId: string
  documentTypeId: string
  templateId?: string
  dataJson: string
  subtotalSatang?: number
  vatSatang?: number
  totalSatang?: number
}) {
  try {
    // 1. Mock Authentication & Context (since there is no real auth yet)
    // We ensure there is at least one company and one user to link this document to.
    let company = await prisma.company.findFirst()
    if (!company) {
      company = await prisma.company.create({
        data: { name: 'Demo Company' }
      })
    }

    let user = await prisma.companyUser.findFirst({ where: { companyId: company.id } })
    if (!user) {
      user = await prisma.companyUser.create({
        data: {
          companyId: company.id,
          name: 'Demo User',
          email: 'demo@example.com',
          passwordHash: 'dummy'
        }
      })
    }

    // 2. Generate a Document Number (Mock simple running logic)
    const docCount = await prisma.document.count({ where: { companyId: company.id } })
    const documentNo = `DOC-2026-${String(docCount + 1).padStart(4, '0')}`

    // 3. Create the document
    const newDoc = await prisma.document.create({
      data: {
        companyId: company.id,
        categoryId: formData.categoryId,
        documentTypeId: formData.documentTypeId,
        templateId: formData.templateId || undefined,
        createdById: user.id,
        title: formData.title,
        documentNo: documentNo,
        status: 'PENDING', // Default to pending for approval flow demo
        dataJson: formData.dataJson || '{}',
        subtotalSatang: formData.subtotalSatang || null,
        vatSatang: formData.vatSatang || null,
        totalSatang: formData.totalSatang || null,
      }
    })

    revalidatePath('/documents')
    revalidatePath('/documents/pending')
    
    return { success: true, document: newDoc }
  } catch (error) {
    console.error('Failed to create document:', error)
    return { success: false, error: 'Failed to create document' }
  }
}

export async function updateDocument(id: string, formData: {
  title: string
  categoryId: string
  documentTypeId: string
  templateId?: string
  dataJson: string
  subtotalSatang?: number
  vatSatang?: number
  totalSatang?: number
}) {
  try {
    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        title: formData.title,
        categoryId: formData.categoryId,
        documentTypeId: formData.documentTypeId,
        templateId: formData.templateId || null,
        dataJson: formData.dataJson || '{}',
        subtotalSatang: formData.subtotalSatang || null,
        vatSatang: formData.vatSatang || null,
        totalSatang: formData.totalSatang || null,
      }
    })

    revalidatePath('/documents')
    revalidatePath(`/documents/${id}`)
    revalidatePath('/documents/pending')
    
    return { success: true, document: updatedDoc }
  } catch (error) {
    console.error('Failed to update document:', error)
    return { success: false, error: 'Failed to update document' }
  }
}

export async function deleteDocument(id: string) {
  try {
    await prisma.document.delete({
      where: { id }
    })
    
    revalidatePath('/documents')
    revalidatePath('/documents/pending')
    
    return { success: true }
  } catch (error) {
    console.error('Failed to delete document:', error)
    return { success: false, error: 'Failed to delete document' }
  }
}
