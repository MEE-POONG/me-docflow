'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { DocumentStatus } from '@prisma/client';

// Helper to get a default company since there's no auth yet
async function getDefaultCompanyId() {
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Default Company',
        legalName: 'Default Company Ltd.',
      },
    });
  }
  return company.id;
}

// Helper to get or create a default user
async function getDefaultUserId(companyId: string) {
  let user = await prisma.companyUser.findFirst({ where: { companyId } });
  if (!user) {
    user = await prisma.companyUser.create({
      data: {
        companyId,
        name: 'Admin',
        email: 'admin@default.com',
        passwordHash: 'hashed',
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });
  }
  return user.id;
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
};

export async function getDocuments(): Promise<DocumentWithRelations[]> {
  const companyId = await getDefaultCompanyId();
  return prisma.document.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
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
}

export async function getDocumentCategories() {
  const companyId = await getDefaultCompanyId();
  return prisma.documentCategory.findMany({
    where: { OR: [{ companyId }, { isGlobal: true }], isActive: true },
    orderBy: { showOrder: 'asc' },
    select: { id: true, name: true },
  });
}

export async function getDocumentTypes(categoryId?: string) {
  const companyId = await getDefaultCompanyId();
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

export async function createDocument(data: {
  title: string;
  categoryId: string;
  documentTypeId: string;
  status: DocumentStatus;
  note?: string | null;
}) {
  const companyId = await getDefaultCompanyId();
  const createdById = await getDefaultUserId(companyId);

  // Auto-generate documentNo based on count
  const existingCount = await prisma.document.count({ where: { companyId } });
  const year = new Date().getFullYear();
  const documentNo = `DOC-${year}-${String(existingCount + 1).padStart(4, '0')}`;

  await prisma.document.create({
    data: {
      companyId,
      categoryId: data.categoryId,
      documentTypeId: data.documentTypeId,
      createdById,
      documentNo,
      title: data.title,
      status: data.status,
      note: data.note || null,
      dataJson: {},
    },
  });
  revalidatePath('/documents');
}

export async function updateDocument(
  id: string,
  data: {
    title: string;
    categoryId: string;
    documentTypeId: string;
    status: DocumentStatus;
    note?: string | null;
  }
) {
  const companyId = await getDefaultCompanyId();
  await prisma.document.update({
    where: { id, companyId },
    data: {
      title: data.title,
      categoryId: data.categoryId,
      documentTypeId: data.documentTypeId,
      status: data.status,
      note: data.note || null,
    },
  });
  revalidatePath('/documents');
}

export async function deleteDocument(id: string) {
  const companyId = await getDefaultCompanyId();
  // Delete related files and approvals first
  await prisma.documentFile.deleteMany({ where: { documentId: id, companyId } });
  await prisma.documentApproval.deleteMany({ where: { documentId: id, companyId } });
  await prisma.document.delete({ where: { id, companyId } });
  revalidatePath('/documents');
}
