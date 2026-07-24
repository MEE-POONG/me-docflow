'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper to get a default company since there's no auth yet
async function getDefaultCompanyId() {
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Default Company',
        legalName: 'Default Company Ltd.',
      }
    });
  }
  return company.id;
}

export async function getDepartments() {
  const companyId = await getDefaultCompanyId();
  return prisma.department.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createDepartment(data: {
  name: string;
  description?: string | null;
  isActive: boolean;
}) {
  const companyId = await getDefaultCompanyId();
  
  await prisma.department.create({
    data: {
      ...data,
      companyId,
    }
  });
  revalidatePath('/departments');
}

export async function updateDepartment(id: string, data: {
  name: string;
  description?: string | null;
  isActive: boolean;
}) {
  const companyId = await getDefaultCompanyId();
  
  await prisma.department.update({
    where: { id, companyId },
    data,
  });
  revalidatePath('/departments');
}

export async function deleteDepartment(id: string) {
  const companyId = await getDefaultCompanyId();
  await prisma.department.delete({
    where: { id, companyId }
  });
  revalidatePath('/departments');
}
