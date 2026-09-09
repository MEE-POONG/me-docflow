'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper to get current company (mocked for now, same as templates/actions.ts)
async function getDefaultCompanyId() {
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'Default Company', legalName: 'Default Company Ltd.' },
    });
  }
  return company.id;
}

export async function getGlobalCategoriesAndSettings(companyId: string) {
  // Validate companyId
  if (!/^[a-fA-F0-9]{24}$/.test(companyId)) {
    return { categories: [], enabledGlobalCategoryIds: [] };
  }
  
  const [categories, company] = await Promise.all([
    prisma.documentCategory.findMany({
      where: { isGlobal: true, isActive: true },
      orderBy: { showOrder: 'asc' },
      select: { id: true, name: true, description: true }
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true }
    })
  ]);

  const settings = company?.settings as any || {};
  // If undefined, it means the user hasn't configured it yet. We assume all are enabled by default.
  const enabledGlobalCategoryIds: string[] | null = settings.enabledGlobalCategoryIds ?? null;

  return { categories, enabledGlobalCategoryIds };
}

export async function updateGlobalCategoriesSettings(companyId: string, enabledIds: string[]) {
  if (!/^[a-fA-F0-9]{24}$/.test(companyId)) return;
  
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { settings: true }
  });
  
  const currentSettings = (company?.settings as any) || {};
  
  await prisma.company.update({
    where: { id: companyId },
    data: {
      settings: {
        ...currentSettings,
        enabledGlobalCategoryIds: enabledIds
      }
    }
  });

  revalidatePath('/settings/templates');
  revalidatePath('/templates');
  revalidatePath('/documents');
}
