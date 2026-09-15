'use server';

import { requireDocumentUser, requireDocumentAccess, documentPermissions, documentVisibilityWhere } from '@/lib/document-access';
import { requireDocumentApprover } from '@/lib/document-approval-access';
import { signaturePayload } from '@/lib/document-signature';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { DocumentStatus } from '@prisma/client';

// Helper to get a default company since there's no auth yet
async function getDefaultCompanyId() {
  return (await requireDocumentUser()).companyId;
}

// Helper to get or create a default user
async function getDefaultUserId(companyId: string) {
  const user = await requireDocumentUser();
  if (user.companyId !== companyId) throw new Error('บริษัทไม่ถูกต้อง');
  return user.id;
}

async function getGlobalCondition(companyId: string, idField: 'id' | 'categoryId' | 'documentTypeId' = 'id') {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { settings: true }
  });
  const settings = (company?.settings as any) || {};
  const enabledIds = settings.enabledGlobalCategoryIds;
  
  if (Array.isArray(enabledIds)) {
    // If we're filtering documentTypes or templates, their parent is categoryId
    const field = idField === 'id' ? 'id' : 'categoryId';
    return { isGlobal: true, [field]: { in: enabledIds } };
  }
  return { isGlobal: true };
}

export type DocumentWithRelations = {
  id: string;
  documentNo: string;
  title: string;
  status: DocumentStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string };
  documentType: { id: string; name: string };
  createdBy: { id: string; name: string };
  canManage?: boolean;
  canEdit?: boolean;
};

export async function getDocuments(): Promise<DocumentWithRelations[]> {
  return getDocumentsByCompany((await requireDocumentUser()).companyId);
}

function getValidCompanyId(companyId: string) {
  return /^[a-fA-F0-9]{24}$/.test(companyId);
}

export async function getDocumentsByCompany(companyId: string): Promise<DocumentWithRelations[]> {
  if (!getValidCompanyId(companyId)) return [];
  const user = await requireDocumentUser();
  if (companyId !== user.companyId) throw new Error('บริษัทไม่ถูกต้อง');
  const rows = await prisma.document.findMany({
    where: documentVisibilityWhere(user),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, companyId: true, createdById: true, editorUserIds: true,
      documentNo: true,
      title: true,
      status: true,
      note: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { id: true, name: true } },
      documentType: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  return rows.map(row => ({ ...row, ...documentPermissions(user, row) }));
}

export async function getPendingDocumentsByCompany(companyId: string) {
  if (!getValidCompanyId(companyId)) return [];
  const user = await requireDocumentUser();
  if (user.companyId !== companyId) throw new Error('บริษัทไม่ถูกต้อง');
  return prisma.document.findMany({
    where: {
      ...documentVisibilityWhere(user),
      status: {
        in: ['PENDING', 'APPROVED', 'REJECTED']
      }
    },
    include: {
      createdBy: true,
      company: true,
      template: true,
      category: true,
      documentType: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getTemplatesByCompany(companyId: string) {
  if (!getValidCompanyId(companyId)) {
    return prisma.documentTemplate.findMany({
      where: { isGlobal: true },
      include: { category: true, documentType: true, createdByUser: true },
      orderBy: { createdAt: 'desc' }
    });
  }
  return prisma.documentTemplate.findMany({
    where: {
      OR: [{ companyId }, { isGlobal: true }],
    },
    include: {
      category: true,
      documentType: true,
      createdByUser: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getDocumentCategories() {
  const companyId = await getDefaultCompanyId();
  const globalCond = await getGlobalCondition(companyId, 'id');
  return prisma.documentCategory.findMany({
    where: { OR: [{ companyId }, globalCond], isActive: true },
    orderBy: { showOrder: 'asc' },
    select: { id: true, name: true },
  });
}

export async function getCategoriesByCompany(companyId: string) {
  if (!getValidCompanyId(companyId)) {
    return prisma.documentCategory.findMany({
      where: { isGlobal: true, isActive: true },
      orderBy: { showOrder: 'asc' },
      select: { id: true, name: true },
    });
  }
  return prisma.documentCategory.findMany({
    where: { OR: [{ companyId }, { isGlobal: true }], isActive: true },
    orderBy: { showOrder: 'asc' },
    select: { id: true, name: true },
  });
}

export async function getDocumentTypes(categoryId?: string) {
  const companyId = await getDefaultCompanyId();
  const globalCond = await getGlobalCondition(companyId, 'categoryId');
  return prisma.documentType.findMany({
    where: {
      OR: [{ companyId }, globalCond],
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { showOrder: 'asc' },
    select: { id: true, name: true, categoryId: true },
  });
}

export async function getDocumentTypesByCompany(companyId: string, categoryId?: string) {
  if (!getValidCompanyId(companyId)) {
    return prisma.documentType.findMany({
      where: { isGlobal: true, isActive: true, ...(categoryId ? { categoryId } : {}) },
      orderBy: { showOrder: 'asc' },
      select: { id: true, name: true, categoryId: true },
    });
  }
  return prisma.documentType.findMany({
    where: {
      OR: [{ companyId }, { isGlobal: true }],
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { showOrder: 'asc' },
    select: { id: true, name: true, categoryId: true },
  });
}

export async function getDocumentTemplates(documentTypeId?: string) {
  const companyId = await getDefaultCompanyId();
  const globalCond = await getGlobalCondition(companyId, 'documentTypeId');
  return prisma.documentTemplate.findMany({
    where: {
      OR: [{ companyId }, globalCond],
      isActive: true,
      ...(documentTypeId ? { documentTypeId } : {}),
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, documentTypeId: true, categoryId: true },
  });
}

export async function createDocument(data: {
  title: string;
  categoryId: string;
  documentTypeId: string;
  templateId?: string | null;
  status?: DocumentStatus;
  note?: string | null;
  dataJson?: any;
  subtotalSatang?: number;
  vatSatang?: number;
  totalSatang?: number;
}) {
  const companyId = await getDefaultCompanyId();
  if (data.status === 'APPROVED') throw new Error('กรุณาส่งเอกสารรออนุมัติก่อน');
  const createdById = await getDefaultUserId(companyId);

  // Auto-generate documentNo based on count
  const existingCount = await prisma.document.count({ where: { companyId } });
  const year = new Date().getFullYear();
  const documentNo = `DOC-${year}-${String(existingCount + 1).padStart(4, '0')}`;

  const document = await prisma.document.create({
    data: {
      companyId,
      categoryId: data.categoryId,
      documentTypeId: data.documentTypeId,
      templateId: data.templateId || null,
      createdById,
      documentNo,
      title: data.title,
      status: data.status || 'DRAFT',
      note: data.note || null,
      dataJson: signaturePayload(data.dataJson),
      subtotalSatang: data.subtotalSatang || null,
      vatSatang: data.vatSatang || null,
      totalSatang: data.totalSatang || null,
    },
  });
  revalidatePath('/documents');
  return { success: true, document };
}

export async function updateDocument(
  id: string,
  data: {
    title: string;
    categoryId: string;
    documentTypeId: string;
    templateId?: string | null;
    status?: DocumentStatus;
    note?: string | null;
    dataJson?: any;
    subtotalSatang?: number;
    vatSatang?: number;
    totalSatang?: number;
  }
) {
  if (data.status === 'APPROVED') throw new Error('กรุณาใช้ปุ่มอนุมัติเอกสาร');
  const companyId = await getDefaultCompanyId();
  await requireDocumentAccess(id, 'edit');
  const document = await prisma.document.update({
    where: { id, companyId, isLocked: false, status: { in: ['DRAFT', 'REJECTED'] } },
    data: {
      title: data.title,
      categoryId: data.categoryId,
      documentTypeId: data.documentTypeId,
      templateId: data.templateId || null,
      ...(data.status ? { status: data.status } : {}),
      note: data.note || null,
      ...(data.dataJson ? { dataJson: signaturePayload(data.dataJson) } : {}),
      ...(data.subtotalSatang !== undefined ? { subtotalSatang: data.subtotalSatang } : {}),
      ...(data.vatSatang !== undefined ? { vatSatang: data.vatSatang } : {}),
      ...(data.totalSatang !== undefined ? { totalSatang: data.totalSatang } : {}),
    },
  });
  revalidatePath('/documents');
  return { success: true, document };
}

export async function updateDocumentStatus(id: string, status: DocumentStatus) {
  if (status === 'APPROVED') {
    const user = await requireDocumentApprover();
    await requireDocumentAccess(id);
    await prisma.document.update({
      where: { id, companyId: user.companyId, status: 'PENDING', isLocked: false },
      data: { status, approvedAt: new Date(), approvedById: user.id },
    });
    revalidatePath('/documents');
    revalidatePath('/documents/pending');
    return;
  }
  const companyId = await getDefaultCompanyId();
  await requireDocumentAccess(id, 'edit');
  if (status === 'PENDING') throw new Error('กรุณาลงนามและยื่นผ่านหน้าเอกสาร');
  await prisma.document.update({
    where: { id, companyId, isLocked: false },
    data: { status },
  });
  revalidatePath('/documents');
}

export async function deleteDocument(id: string) {
  await requireDocumentAccess(id, 'manage');
  const companyId = await getDefaultCompanyId();
  const locked = await prisma.document.findFirst({ where: { id, companyId, isLocked: true }, select: { id: true } });
  if (locked) throw new Error('เอกสารลงนามแล้ว ไม่สามารถลบได้');
  // Delete related files and approvals first
  await prisma.documentFile.deleteMany({ where: { documentId: id, companyId } });
  await prisma.documentApproval.deleteMany({ where: { documentId: id, companyId } });
  await prisma.document.delete({ where: { id, companyId, isLocked: false } });
  revalidatePath('/documents');
}
