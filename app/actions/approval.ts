'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function approveDocument(documentId: string) {
  try {
    // In a real app, we would verify the user's permissions and session here.
    // For this mock, we will just update the document status directly.

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        // Mocking action user ID for now
        // approvedById: 'some-user-id' 
      }
    })

    revalidatePath('/documents/pending')
    revalidatePath('/documents')
    
    return { success: true }
  } catch (error) {
    console.error('Failed to approve document:', error)
    return { success: false, error: 'Failed to approve document' }
  }
}

export async function rejectDocument(documentId: string, reason: string) {
  try {
    await prisma.document.update({
      where: { id: documentId },
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
