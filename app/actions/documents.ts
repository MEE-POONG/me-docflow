'use server'

import { signaturePayload } from '@/lib/document-signature'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { DocumentActor } from '@/lib/document-actor'
import { defaultNumberConfig, formatDocumentNumber, numberPeriod, validateNumberConfig, type NumberSettingsRow } from '@/lib/document-numbering'

async function resolveActor(actor: DocumentActor) {
  if (!actor || !/^[a-fA-F0-9]{24}$/.test(actor.companyId) || !actor.userEmail) {
    throw new Error('ไม่พบข้อมูลบริษัทหรือผู้ใช้ กรุณาเข้าสู่ระบบใหม่')
  }
  const user = await prisma.companyUser.findFirst({
    where: { companyId: actor.companyId, email: actor.userEmail.trim().toLowerCase(), status: 'ACTIVE' },
    select: { id: true, companyId: true, company: { select: { id: true, name: true, taxId: true, address: true, phone: true, logoUrl: true } } },
  })
  if (!user) throw new Error('ไม่พบผู้ใช้ในบริษัทที่เลือก กรุณาเข้าสู่ระบบใหม่')
  return user
}

export async function getDocumentCompany(actor: DocumentActor) {
  return (await resolveActor(actor)).company
}

export async function getDocumentFormOptions(actor: DocumentActor) {
  const user = await resolveActor(actor)
  const companySettings = await prisma.company.findUnique({ where: { id: user.companyId }, select: { settings: true } })
  const enabled = (companySettings?.settings as any)?.enabledGlobalCategoryIds
  const categories = await prisma.documentCategory.findMany({ where: { isActive: true, OR: [
    { companyId: user.companyId }, { isGlobal: true, ...(Array.isArray(enabled) ? { id: { in: enabled } } : {}) },
  ] }, orderBy: { showOrder: 'asc' } })
  const categoryIds = categories.map(c => c.id)
  const documentTypes = await prisma.documentType.findMany({ where: { isActive: true, categoryId: { in: categoryIds }, OR: [{ companyId: user.companyId }, { isGlobal: true }] }, orderBy: { showOrder: 'asc' } })
  const templates = await prisma.documentTemplate.findMany({ where: { isActive: true, documentTypeId: { in: documentTypes.map(t => t.id) }, OR: [{ companyId: user.companyId }, { isGlobal: true }] }, include: { fields: { orderBy: { showOrder: 'asc' } } }, orderBy: { createdAt: 'desc' } })
  return { company: user.company, categories, documentTypes, templates }
}

export async function getDocumentNumberSettings(actor: DocumentActor): Promise<NumberSettingsRow[]> {
  const user = await resolveActor(actor)
  const types = await prisma.documentType.findMany({
    where: { isActive: true, OR: [{ companyId: user.companyId }, { isGlobal: true }] },
    orderBy: [{ showOrder: 'asc' }, { name: 'asc' }],
  })
  const settings = await prisma.documentNumberSetting.findMany({ where: { companyId: user.companyId } })
  const period = numberPeriod()
  return types.map(type => {
    const setting = settings.find(s => s.documentTypeId === type.id)
    const reset = setting && ((setting.resetMode === 'MONTHLY' && (setting.currentYear !== period.year || setting.currentMonth !== period.month))
      || (setting.resetMode === 'YEARLY' && setting.currentYear !== period.year))
    return { documentTypeId: type.id, title: type.name, saved: !!setting,
      ...(setting ? { prefix: setting.prefix, useDate: setting.resetMode !== 'NEVER', digits: setting.padding, startNumber: reset ? 1 : setting.runningNumber }
        : defaultNumberConfig(type)) }
  })
}

export async function saveDocumentNumberSettings(actor: DocumentActor, rows: NumberSettingsRow[]) {
  try {
    const user = await resolveActor(actor)
    if (!Array.isArray(rows) || rows.length > 500 || new Set(rows.map(r => r.documentTypeId)).size !== rows.length) throw new Error('รายการตั้งค่าไม่ถูกต้อง')
    const configs = rows.map(row => ({ ...validateNumberConfig(row), documentTypeId: row.documentTypeId }))
    const types = await prisma.documentType.findMany({ where: {
      id: { in: configs.map(c => c.documentTypeId) }, isActive: true,
      OR: [{ companyId: user.companyId }, { isGlobal: true }],
    } })
    if (types.length !== configs.length) throw new Error('ประเภทเอกสารไม่ตรงกับบริษัทที่เลือก')
    const period = numberPeriod()
    await prisma.$transaction(async tx => {
      for (const config of configs) {
        const where = { companyId_documentTypeId: { companyId: user.companyId, documentTypeId: config.documentTypeId } }
        const previous = await tx.documentNumberSetting.findUnique({ where })
        const sameSeries = previous?.prefix === config.prefix && (previous.resetMode !== 'NEVER') === config.useDate
          && (!config.useDate || (previous.currentYear === period.year && previous.currentMonth === period.month))
        const data = { prefix: config.prefix, padding: config.digits,
          runningNumber: sameSeries ? Math.max(previous.runningNumber, config.startNumber) : config.startNumber,
          resetMode: config.useDate ? 'MONTHLY' : 'NEVER', currentYear: period.year, currentMonth: period.month }
        await tx.documentNumberSetting.upsert({ where,
          create: { companyId: user.companyId, documentTypeId: config.documentTypeId, ...data }, update: data })
      }
    })
    revalidatePath('/settings/documents')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'บันทึกการตั้งค่าไม่สำเร็จ' }
  }
}

type DocumentInput = DocumentActor & {
  title: string
  categoryId: string
  documentTypeId: string
  templateId?: string
  dataJson: string
  subtotalSatang?: number
  vatSatang?: number
  totalSatang?: number
}

async function validateForm(input: DocumentInput) {
  const category = await prisma.documentCategory.findFirst({
    where: { id: input.categoryId, OR: [{ companyId: input.companyId }, { isGlobal: true }] },
    select: { id: true },
  })
  const type = await prisma.documentType.findFirst({
    where: { id: input.documentTypeId, categoryId: input.categoryId }, select: { id: true },
  })
  if (!category || !type) throw new Error('หมวดหมู่หรือประเภทเอกสารไม่ตรงกับบริษัทที่เลือก')
  if (input.templateId) {
    const template = await prisma.documentTemplate.findFirst({
      where: { id: input.templateId, categoryId: input.categoryId, documentTypeId: input.documentTypeId,
        OR: [{ companyId: input.companyId }, { isGlobal: true }] }, select: { id: true },
    })
    if (!template) throw new Error('เทมเพลตไม่ตรงกับประเภทเอกสารหรือบริษัทที่เลือก')
  }
}

function documentData(input: DocumentInput) {
  return {
    title: input.title, categoryId: input.categoryId, documentTypeId: input.documentTypeId,
    templateId: input.templateId || null,
    dataJson: signaturePayload(input.dataJson),
    subtotalSatang: input.subtotalSatang ?? null,
    vatSatang: input.vatSatang ?? null,
    totalSatang: input.totalSatang ?? null,
  }
}

function refreshDocuments(id?: string) {
  revalidatePath('/documents')
  revalidatePath('/documents/pending')
  if (id) revalidatePath(`/documents/${id}`)
}

export async function createDocument(input: DocumentInput) {
  try {
    const user = await resolveActor(input)
    await validateForm(input)
    const type = await prisma.documentType.findUniqueOrThrow({ where: { id: input.documentTypeId } })
    const defaults = defaultNumberConfig(type)
    const now = new Date()
    const period = numberPeriod(now)
    let document
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        document = await prisma.$transaction(async tx => {
          const where = { companyId_documentTypeId: { companyId: user.companyId, documentTypeId: input.documentTypeId } }
          const setting = await tx.documentNumberSetting.upsert({ where, update: {}, create: {
            companyId: user.companyId, documentTypeId: input.documentTypeId,
            prefix: defaults.prefix, padding: defaults.digits, runningNumber: defaults.startNumber,
            resetMode: 'MONTHLY', currentYear: period.year, currentMonth: period.month,
          } })
          const reset = (setting.resetMode === 'MONTHLY' && (setting.currentYear !== period.year || setting.currentMonth !== period.month))
            || (setting.resetMode === 'YEARLY' && setting.currentYear !== period.year)
          const config = { prefix: setting.prefix, digits: setting.padding, useDate: setting.resetMode !== 'NEVER', startNumber: reset ? 1 : setting.runningNumber }
          // Check existing numbers too, including numbers created under an older setting.
          const prefix = `${config.prefix}${config.useDate ? `-${period.stamp}-` : ''}`
          const existing = await tx.document.findMany({ where: { companyId: user.companyId, documentNo: { startsWith: prefix } }, select: { documentNo: true } })
          const next = existing.reduce((number, doc) => {
            const suffix = doc.documentNo.slice(prefix.length)
            return /^\d+$/.test(suffix) ? Math.max(number, Number(suffix) + 1) : number
          }, config.startNumber)
          if (next >= 2_000_000_000) throw new Error('เลขรันเกินขอบเขต กรุณาเปลี่ยนคำขึ้นต้นเลขเอกสาร')
          await tx.documentNumberSetting.update({ where, data: { runningNumber: next + 1, currentYear: period.year, currentMonth: period.month } })
          return tx.document.create({ data: {
            ...documentData(input), companyId: user.companyId, createdById: user.id,
            documentNo: formatDocumentNumber(config, next, now), status: 'DRAFT',
          } })
        })
        break
      } catch (error) {
        const code = (error as { code?: string }).code
        if (attempt === 4 || (code !== 'P2034' && code !== 'P2002')) throw error
      }
    }
    if (!document) throw new Error('สร้างเลขเอกสารไม่สำเร็จ กรุณาลองอีกครั้ง')
    refreshDocuments(document.id)
    return { success: true, document }
  } catch (error) {
    console.error('Failed to create document:', error)
    return { success: false, error: error instanceof Error ? error.message : 'บันทึกเอกสารไม่สำเร็จ' }
  }
}

export async function updateDocument(id: string, input: DocumentInput) {
  try {
    const user = await resolveActor(input)
    await validateForm(input)
    const document = await prisma.document.update({
      where: { id, companyId: user.companyId, isLocked: false, status: { in: ['DRAFT', 'REJECTED'] } },
      data: documentData(input),
    })
    refreshDocuments(id)
    return { success: true, document }
  } catch (error) {
    console.error('Failed to update document:', error)
    return { success: false, error: 'แก้ไขเอกสารไม่สำเร็จ กรุณาตรวจสอบบริษัทและสถานะเอกสาร' }
  }
}

export async function deleteDocument(id: string, actor: DocumentActor) {
  try {
    const user = await resolveActor(actor)
    await prisma.document.delete({ where: { id, companyId: user.companyId, isLocked: false } })
    refreshDocuments(id)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete document:', error)
    return { success: false, error: 'ลบเอกสารไม่สำเร็จ' }
  }
}

export async function submitDocument(id: string, actor: DocumentActor) {
  try {
    const user = await resolveActor(actor)
    const current = await prisma.document.findFirst({
      where: { id, companyId: user.companyId, createdById: user.id },
      select: { dataJson: true, isLocked: true, status: true },
    })
    const storedData = current && (typeof current.dataJson === 'string' ? JSON.parse(current.dataJson) : current.dataJson) as Record<string, any> | null
    const legacySubmitterSignature = current?.isLocked && current.status === 'PENDING' && !storedData?.submitterSignature
      && storedData?.electronicSignature?.userId === user.id && !storedData?.approvalSubmittedAt ? storedData.electronicSignature : null
    const submitterSignature = storedData?.submitterSignature || legacySubmitterSignature
    if (!current || !storedData || !submitterSignature || submitterSignature.userId !== user.id) {
      throw new Error('ผู้สร้างเอกสารต้องลงนามก่อนยื่นขออนุมัติ')
    }
    if (storedData.approvalSubmittedAt) throw new Error('เอกสารนี้ถูกยื่นขออนุมัติแล้ว')
    const approvalSubmittedAt = new Date().toISOString()
    const document = await prisma.document.update({
      where: { id, companyId: user.companyId, createdById: user.id, isLocked: current.isLocked, status: { in: ['DRAFT', 'REJECTED', 'PENDING'] } },
      data: { status: 'PENDING', isLocked: false, dataJson: { ...signaturePayload(storedData), submitterSignature, approvalSubmittedAt } },
    })
    refreshDocuments(id)
    return { success: true, document }
  } catch (error) {
    console.error('Failed to submit document:', error)
    return { success: false, error: error instanceof Error ? error.message : 'ยื่นอนุมัติไม่สำเร็จ กรุณาตรวจสอบบริษัทและสถานะเอกสาร' }
  }
}
