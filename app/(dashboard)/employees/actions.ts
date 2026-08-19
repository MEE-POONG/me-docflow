'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

async function saveFile(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'employees');
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (e) {}

  const ext = file.name.split('.').pop() || 'tmp';
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(uploadDir, filename);
  
  await writeFile(filepath, buffer);
  return `/uploads/employees/${filename}`;
}

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
}, formData?: FormData) {
  const companyId = await getCompanyIdByEmail(email);
  
  let profilePictureUrl = null;
  let idCardDocumentUrl = null;
  let bankAccountDocumentUrl = null;

  if (formData) {
    profilePictureUrl = await saveFile(formData.get('profilePicture') as File | null);
    idCardDocumentUrl = await saveFile(formData.get('idCardDocument') as File | null);
    bankAccountDocumentUrl = await saveFile(formData.get('bankAccountDocument') as File | null);
  }
  
  const { employeeEmail, departmentId, ...restData } = data;

  await prisma.employee.create({
    data: {
      ...restData,
      email: employeeEmail,
      departmentId: departmentId || null,
      companyId,
      profilePictureUrl,
      idCardDocumentUrl,
      bankAccountDocumentUrl,
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
}, formData?: FormData) {
  const companyId = await getCompanyIdByEmail(email);
  
  const { employeeEmail, departmentId, ...restData } = data;
  
  const updateData: any = {
    ...restData,
    email: employeeEmail,
    departmentId: departmentId || null,
  };

  if (formData) {
    const profilePictureUrl = await saveFile(formData.get('profilePicture') as File | null);
    const idCardDocumentUrl = await saveFile(formData.get('idCardDocument') as File | null);
    const bankAccountDocumentUrl = await saveFile(formData.get('bankAccountDocument') as File | null);
    
    if (profilePictureUrl) updateData.profilePictureUrl = profilePictureUrl;
    if (idCardDocumentUrl) updateData.idCardDocumentUrl = idCardDocumentUrl;
    if (bankAccountDocumentUrl) updateData.bankAccountDocumentUrl = bankAccountDocumentUrl;
  }
  
  await prisma.employee.update({
    where: { id, companyId },
    data: updateData,
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
