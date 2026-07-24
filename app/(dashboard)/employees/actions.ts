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

export async function getEmployees() {
  const companyId = await getDefaultCompanyId();
  return prisma.employee.findMany({
    where: { companyId },
    include: {
      department: true,
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getDepartments() {
  const companyId = await getDefaultCompanyId();
  return prisma.department.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: 'asc' }
  });
}

export async function createEmployee(data: {
  code?: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  departmentId?: string;
  salarySatang?: number;
  startDate?: Date | null;
  endDate?: Date | null;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DELETED';
}) {
  const companyId = await getDefaultCompanyId();
  
  // If no code is provided, you might want to auto-generate one, but we'll leave it as is.
  await prisma.employee.create({
    data: {
      ...data,
      departmentId: data.departmentId || null,
      companyId,
    }
  });
  revalidatePath('/employees');
}

export async function updateEmployee(id: string, data: {
  code?: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  departmentId?: string;
  salarySatang?: number;
  startDate?: Date | null;
  endDate?: Date | null;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DELETED';
}) {
  const companyId = await getDefaultCompanyId();
  
  await prisma.employee.update({
    where: { id, companyId },
    data: {
      ...data,
      departmentId: data.departmentId || null,
    },
  });
  revalidatePath('/employees');
}

export async function deleteEmployee(id: string) {
  const companyId = await getDefaultCompanyId();
  await prisma.employee.delete({
    where: { id, companyId }
  });
  revalidatePath('/employees');
}
