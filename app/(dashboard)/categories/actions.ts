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

async function getGlobalCondition(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { settings: true }
  });
  const settings = (company?.settings as any) || {};
  const enabledIds = settings.enabledGlobalCategoryIds;
  
  if (Array.isArray(enabledIds)) {
    return { isGlobal: true, id: { in: enabledIds } };
  }
  return { isGlobal: true };
}

export type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  showOrder: number;
  isActive: boolean;
  _count: { types: number; documents: number };
};

export async function getCategories(): Promise<CategoryWithCount[]> {
  const companyId = await getDefaultCompanyId();
  const globalCond = await getGlobalCondition(companyId);
  return prisma.documentCategory.findMany({
    where: { OR: [{ companyId }, globalCond] },
    orderBy: { showOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      showOrder: true,
      isActive: true,
      _count: { select: { types: true, documents: true } },
    },
  });
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  showOrder?: number;
  isActive: boolean;
}) {
  const companyId = await getDefaultCompanyId();
  await prisma.documentCategory.create({
    data: { ...data, companyId, isGlobal: false },
  });
  revalidatePath('/categories');
  revalidatePath('/documents');
}

export async function updateCategory(
  id: string,
  data: {
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    showOrder?: number;
    isActive: boolean;
  }
) {
  const companyId = await getDefaultCompanyId();
  await prisma.documentCategory.update({
    where: { id },
    data,
  });
  revalidatePath('/categories');
  revalidatePath('/documents');
}

export async function deleteCategory(id: string) {
  await prisma.documentCategory.delete({ where: { id } });
  revalidatePath('/categories');
  revalidatePath('/documents');
}
