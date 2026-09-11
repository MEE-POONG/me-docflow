'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { DocumentActor } from '@/lib/document-actor'
import { documentDigest, signaturePayload, validateSignatureImage } from '@/lib/document-signature'

type SignatureRole = 'submitter' | 'approver'

export async function signDocument(input: DocumentActor & { documentId: string; version: string; templateId: string; image: string; password: string; consent: boolean; signatureRole?: SignatureRole }) {
  try {
    if (!input.consent) throw new Error('กรุณายืนยันการลงนาม')
    validateSignatureImage(input.image)
    const user = await prisma.companyUser.findFirst({ where: { companyId: input.companyId, email: input.userEmail.trim().toLowerCase(), status: 'ACTIVE' } })
    if (!user || !input.password || !await bcrypt.compare(input.password, user.passwordHash)) throw new Error('ยืนยันผู้ลงนามไม่สำเร็จ กรุณาตรวจสอบรหัสผ่าน')
    await prisma.$transaction(async tx => {
      const document = await tx.document.findFirst({ where: { id: input.documentId, companyId: user.companyId } })
      if (!document || document.isLocked || document.updatedAt.toISOString() !== input.version) throw new Error('เอกสารถูกแก้ไขหรือลงนามแล้ว กรุณาโหลดหน้าใหม่ก่อนลงนาม')
      if (document.status === 'CANCELLED' || document.status === 'REJECTED') throw new Error('สถานะเอกสารนี้ไม่สามารถลงนามได้')
      const signatureRole = input.signatureRole || 'approver'
      if (signatureRole === 'submitter' && (!['DRAFT', 'REJECTED', 'PENDING'].includes(document.status) || document.createdById !== user.id)) throw new Error('เฉพาะผู้สร้างเอกสารฉบับนี้เท่านั้นที่ลงนามในช่องผู้ยื่นได้')
      if (signatureRole === 'approver' && document.status !== 'APPROVED') throw new Error('ผู้อนุมัติลงนามได้หลังเอกสารผ่านการอนุมัติแล้ว')
      const template = input.templateId ? await tx.documentTemplate.findFirst({ where: { id: input.templateId, documentTypeId: document.documentTypeId, isActive: true, OR: [{ companyId: user.companyId }, { isGlobal: true }] } }) : null
      if (input.templateId && !template) throw new Error('แบบฟอร์มไม่ตรงกับเอกสาร')
      const templateId = template?.id || null
      const snapshot = template?.layoutJson || null
      const signedAt = new Date().toISOString()
      const hash = documentDigest({ ...document, templateId }, snapshot)
      const electronicSignature = { name: user.name, userId: user.id, signedAt, image: input.image, hash, templateId, layoutSnapshot: snapshot }
      const storedData = typeof document.dataJson === 'string' ? JSON.parse(document.dataJson) : document.dataJson
      const existingSubmitterSignature = (storedData as Record<string, any> | null)?.submitterSignature
      const existingApprovalSubmittedAt = (storedData as Record<string, any> | null)?.approvalSubmittedAt
      if (signatureRole === 'submitter' && existingSubmitterSignature) throw new Error('ผู้ยื่นได้ลงนามเอกสารนี้แล้ว')
      const dataJson = signatureRole === 'submitter'
        ? { ...signaturePayload(document.dataJson), submitterSignature: electronicSignature }
        : { ...signaturePayload(document.dataJson), ...(existingSubmitterSignature ? { submitterSignature: existingSubmitterSignature } : {}), ...(existingApprovalSubmittedAt ? { approvalSubmittedAt: existingApprovalSubmittedAt } : {}), electronicSignature }
      await tx.document.update({ where: { id: document.id, companyId: user.companyId, updatedAt: document.updatedAt, isLocked: false },
        data: { templateId, isLocked: signatureRole === 'approver', dataJson } })
      await tx.auditLog.create({ data: { companyId: user.companyId, actorUserId: user.id, action: signatureRole === 'submitter' ? 'DOCUMENT_SUBMITTER_SIGNED' : 'DOCUMENT_SIGNED', module: 'documents', detail: { documentId: document.id, documentNo: document.documentNo, hash, signedAt, signatureRole } } })
    })
    revalidatePath(`/documents/${input.documentId}`)
    revalidatePath('/documents')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'ลงนามไม่สำเร็จ กรุณาลองอีกครั้ง' }
  }
}
