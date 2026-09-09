'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function getValidCompanyId(companyId: string) {
  return /^[a-fA-F0-9]{24}$/.test(companyId);
}

export type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  showOrder: number;
  isActive: boolean;
  isGlobal: boolean;
  _count: { types: number; documents: number };
};

export async function getCategoriesByCompany(companyId: string): Promise<{ categories: CategoryWithCount[], enabledGlobalCategoryIds: string[] }> {
  if (!getValidCompanyId(companyId)) return { categories: [], enabledGlobalCategoryIds: [] };
  
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { settings: true }
  });
  const settings = (company?.settings as any) || {};
  const enabledGlobalCategoryIds = Array.isArray(settings.enabledGlobalCategoryIds) ? settings.enabledGlobalCategoryIds : [];

  const categories = await prisma.documentCategory.findMany({
    where: { OR: [{ companyId }, { isGlobal: true }] },
    orderBy: { showOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      showOrder: true,
      isActive: true,
      isGlobal: true,
      _count: { select: { types: true, documents: true } },
    },
  });

  return { categories: categories as CategoryWithCount[], enabledGlobalCategoryIds };
}

export async function getGlobalCategories(): Promise<CategoryWithCount[]> {
  const categories = await prisma.documentCategory.findMany({
    where: { isGlobal: true },
    orderBy: { showOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      showOrder: true,
      isActive: true,
      isGlobal: true,
      _count: { select: { types: true, documents: true } },
    },
  });
  return categories as CategoryWithCount[];
}

export async function toggleGlobalCategory(companyId: string, categoryId: string, enabled: boolean) {
  if (!getValidCompanyId(companyId)) return;
  
  let company = await prisma.company.findUnique({ where: { id: companyId }, select: { settings: true } });
  
  if (!company) {
    if (companyId === "64abc0000000000000000001") {
      company = await prisma.company.create({
        data: {
          id: companyId,
          name: "Mock Company",
          settings: {}
        },
        select: { settings: true }
      });
    } else {
      return;
    }
  }
  
  const settings = (company.settings as any) || {};
  let enabledIds = Array.isArray(settings.enabledGlobalCategoryIds) ? settings.enabledGlobalCategoryIds : [];
  
  if (enabled) {
    if (!enabledIds.includes(categoryId)) enabledIds.push(categoryId);
  } else {
    enabledIds = enabledIds.filter((id: string) => id !== categoryId);
  }
  
  settings.enabledGlobalCategoryIds = enabledIds;
  
  await prisma.company.update({
    where: { id: companyId },
    data: { settings }
  });
  revalidatePath('/categories');
}

export async function createCategory(data: {
  companyId: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  showOrder?: number;
  isActive: boolean;
}) {
  if (!getValidCompanyId(data.companyId)) throw new Error('Invalid companyId');
  await prisma.documentCategory.create({
    data: { ...data, isGlobal: false },
  });
  revalidatePath('/categories');
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
  await prisma.documentCategory.update({
    where: { id },
    data,
  });
  revalidatePath('/categories');
}

export async function deleteCategory(id: string) {
  await prisma.documentCategory.delete({ where: { id } });
  revalidatePath('/categories');
}
