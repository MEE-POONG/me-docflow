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

export async function getEmployees(email?: string) {
  if (!email) return [];
  const companyId = await getCompanyIdByEmail(email);
  return prisma.employee.findMany({
    where: { companyId },
    include: {
      department: true,
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getDepartments(email?: string) {
  if (!email) return [];
  const companyId = await getCompanyIdByEmail(email);
  return prisma.department.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: 'asc' }
  });
}

export async function createEmployee(email: string, data: {
  code?: string;
  name: string;
  employeeEmail?: string;
  phone?: string;
  position?: string;
  departmentId?: string;
  salarySatang?: number;
  startDate?: Date | null;
  endDate?: Date | null;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DELETED';
}) {
  const companyId = await getCompanyIdByEmail(email);
  
  await prisma.employee.create({
    data: {
      ...data,
      email: data.employeeEmail,
      departmentId: data.departmentId || null,
      companyId,
    }
  });
  revalidatePath('/employees');
}

export async function updateEmployee(id: string, email: string, data: {
  code?: string;
  name: string;
  employeeEmail?: string;
  phone?: string;
  position?: string;
  departmentId?: string;
  salarySatang?: number;
  startDate?: Date | null;
  endDate?: Date | null;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DELETED';
}) {
  const companyId = await getCompanyIdByEmail(email);
  
  await prisma.employee.update({
    where: { id, companyId },
    data: {
      ...data,
      email: data.employeeEmail,
      departmentId: data.departmentId || null,
    },
  });
  revalidatePath('/employees');
}

export async function deleteEmployee(id: string, email: string) {
  const companyId = await getCompanyIdByEmail(email);
  await prisma.employee.delete({
    where: { id, companyId }
  });
  revalidatePath('/employees');
}
