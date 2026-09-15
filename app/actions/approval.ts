'use server'

import { requireDocumentAccess } from '@/lib/document-access'
import { prisma } from '@/lib/prisma'
import { getDocumentApprover, requireDocumentApprover } from '@/lib/document-approval-access'
import { revalidatePath } from 'next/cache'

export async function canApproveDocuments() {
  return !!await getDocumentApprover()
}

export async function approveDocument(documentId: string) {
  try {
    const user = await requireDocumentApprover()
    await requireDocumentAccess(documentId)
    await prisma.document.update({
      where: { id: documentId, companyId: user.companyId, status: 'PENDING', isLocked: false },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: user.id, 
      }
    })

    revalidatePath('/documents/pending')
    revalidatePath('/documents')
    
    return { success: true }
  } catch (error) {
    console.error('Failed to approve document:', error)
    return { success: false, error: error instanceof Error ? error.message : 'อนุมัติเอกสารไม่สำเร็จ' }
  }
}

export async function rejectDocument(documentId: string, reason: string) {
  try {
    const { user } = await requireDocumentAccess(documentId)
    await prisma.document.update({
      where: { id: documentId, companyId: user.companyId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedReason: reason,
        // rejectedById: 'some-user-id'
      }
    })

    revalidatePath('/documents/pending')
    revalidatePath('/documents')
    
    return { success: true }
  } catch (error) {
    console.error('Failed to reject document:', error)
    return { success: false, error: 'Failed to reject document' }
  }
}
