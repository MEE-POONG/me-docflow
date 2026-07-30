'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper to get a company by user email
async function getCompanyIdByEmail(email: string) {
  let company = await prisma.company.findFirst({
    where: { email }
  });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'My Company',
        legalName: 'My Company Ltd.',
        email: email
      }
    });
  }
  return company.id;
}

export async function getDepartments(email?: string) {
  if (!email) return [];
  const companyId = await getCompanyIdByEmail(email);
  return prisma.department.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createDepartment(email: string, data: {
  name: string;
  description?: string | null;
  isActive: boolean;
}) {
  const companyId = await getCompanyIdByEmail(email);
  
  await prisma.department.create({
    data: {
      ...data,
      companyId,
    }
  });
  revalidatePath('/departments');
}

export async function updateDepartment(id: string, email: string, data: {
  name: string;
  description?: string | null;
  isActive: boolean;
}) {
  const companyId = await getCompanyIdByEmail(email);
  
  await prisma.department.update({
    where: { id, companyId },
    data,
  });
  revalidatePath('/departments');
}

export async function deleteDepartment(id: string, email: string) {
  const companyId = await getCompanyIdByEmail(email);
  await prisma.department.delete({
    where: { id, companyId }
  });
  revalidatePath('/departments');
}
