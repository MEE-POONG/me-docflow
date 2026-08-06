'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function getDefaultCompanyId() {
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'Default Company', legalName: 'Default Company Ltd.' },
    });
  }
  return company.id;
}

async function getGlobalCondition(companyId: string, idField: 'id' | 'categoryId' = 'id') {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { settings: true }
  });
  const settings = (company?.settings as any) || {};
  const enabledIds = settings.enabledGlobalCategoryIds;
  
  if (Array.isArray(enabledIds)) {
    return { isGlobal: true, [idField]: { in: enabledIds } };
  }
  return { isGlobal: true };
}

export type DocTypeWithRelations = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  showOrder: number;
  isActive: boolean;
  categoryId: string;
  category: { id: string; name: string };
  _count: { documents: number };
};

export async function getDocumentTypes(): Promise<DocTypeWithRelations[]> {
  const companyId = await getDefaultCompanyId();
  const globalCond = await getGlobalCondition(companyId, 'categoryId');
  return prisma.documentType.findMany({
    where: { OR: [{ companyId }, globalCond] },
    orderBy: [{ category: { showOrder: 'asc' } }, { showOrder: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      showOrder: true,
      isActive: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
      _count: { select: { documents: true } },
    },
  });
}

export async function getCategories() {
  const companyId = await getDefaultCompanyId();
  const globalCond = await getGlobalCondition(companyId, 'id');
  return prisma.documentCategory.findMany({
    where: { OR: [{ companyId }, globalCond], isActive: true },
    orderBy: { showOrder: 'asc' },
    select: { id: true, name: true },
  });
}

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function createDocumentType(data: {
  name: string;
  slug?: string;
  categoryId: string;
  description?: string | null;
  showOrder?: number;
  isActive: boolean;
}) {
  const companyId = await getDefaultCompanyId();
  await prisma.documentType.create({
    data: {
      ...data,
      slug: data.slug || slugify(data.name),
      companyId,
      isGlobal: false,
    },
  });
  revalidatePath('/types');
  revalidatePath('/documents');
}

export async function updateDocumentType(
  id: string,
  data: {
    name: string;
    slug?: string;
    categoryId: string;
    description?: string | null;
    showOrder?: number;
    isActive: boolean;
  }
) {
  await prisma.documentType.update({
    where: { id },
    data: { ...data, slug: data.slug || slugify(data.name) },
  });
  revalidatePath('/types');
  revalidatePath('/documents');
}

export async function deleteDocumentType(id: string) {
  await prisma.documentType.delete({ where: { id } });
  revalidatePath('/types');
  revalidatePath('/documents');
}
