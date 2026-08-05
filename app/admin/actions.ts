'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CompanyStatus } from '@prisma/client';

export async function getAdminCompanies() {
  const companies = await prisma.company.findMany({
    include: {
      users: {
        where: { role: 'OWNER' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return companies.map(c => ({
    id: c.id,
    companyName: c.name,
    taxId: c.taxId || '',
    address: c.address || '',
    phone: c.phone || '',
    email: c.email || '',
    website: '',
    ownerEmail: c.users.length > 0 ? c.users[0].email : '',
    isActive: c.status === 'ACTIVE',
    isVerified: c.status === 'ACTIVE',
  }));
}

export async function updateAdminCompany(id: string, data: any) {
  await prisma.company.update({
    where: { id },
    data: {
      name: data.companyName,
      taxId: data.taxId,
      address: data.address,
      phone: data.phone,
      email: data.email,
      status: data.isVerified ? CompanyStatus.ACTIVE : CompanyStatus.INACTIVE,
    },
  });
  revalidatePath('/admin/companies');
}

export async function deleteAdminCompany(id: string) {
  await prisma.companyUser.deleteMany({ where: { companyId: id } });
  await prisma.company.delete({ where: { id } });
  revalidatePath('/admin/companies');
}

export async function getAdminUsers() {
  const users = await prisma.companyUser.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return users.map(u => ({
    id: u.id,
    fullName: u.name,
    email: u.email,
    role: u.role,
    status: u.status === 'ACTIVE' ? 'active' : 'inactive',
  }));
}

export async function updateAdminUser(id: string, data: any) {
  const updateData: any = {
    name: data.fullName,
    email: data.email,
    role: data.role as any,
    status: data.status === 'active' ? 'ACTIVE' : 'INACTIVE',
  };

  if (data.password) {
    updateData.passwordHash = data.password; // Note: In a real app, hash this password
  }

  await prisma.companyUser.update({
    where: { id },
    data: updateData,
  });
  revalidatePath('/admin/users');
}

export async function deleteAdminUser(id: string) {
  await prisma.companyUser.delete({ where: { id } });
  revalidatePath('/admin/users');
}

export async function getAdminCategories() {
  const categories = await prisma.documentCategory.findMany({
    where: { isGlobal: true },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: {
        select: { documents: true }
      }
    }
  });

  return categories.map(c => ({
    id: c.id,
    name: c.name,
    code: c.slug,
    description: c.description || "",
    documentCount: c._count.documents,
    isActive: c.isActive,
  }));
}

export async function createAdminCategory(data: { name: string; code: string; description: string; isActive?: boolean }) {
  await prisma.documentCategory.create({
    data: {
      name: data.name,
      slug: data.code,
      description: data.description,
      isGlobal: true,
      isActive: data.isActive ?? true,
    },
  });
  revalidatePath('/admin/categories');
}

export async function updateAdminCategory(id: string, data: { name: string; code: string; description: string; isActive?: boolean }) {
  await prisma.documentCategory.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.code,
      description: data.description,
      isActive: data.isActive,
    },
  });
  revalidatePath('/admin/categories');
}

export async function deleteAdminCategory(id: string) {
  // Find all global templates in this category
  const templates = await prisma.documentTemplate.findMany({ where: { categoryId: id, isGlobal: true } });
  
  // Delete template fields for those templates
  for (const t of templates) {
    await prisma.templateField.deleteMany({ where: { templateId: t.id } });
  }
  
  // Delete the templates
  await prisma.documentTemplate.deleteMany({ where: { categoryId: id, isGlobal: true } });
  
  // Delete the document types
  await prisma.documentType.deleteMany({ where: { categoryId: id, isGlobal: true } });

  // Ensure no other types are still referencing it (e.g. from tenants)
  const remainingTypes = await prisma.documentType.count({ where: { categoryId: id } });
  if (remainingTypes > 0) {
    throw new Error("Cannot delete category. It is being used by tenant document types.");
  }

  await prisma.documentCategory.delete({ where: { id } });
  revalidatePath('/admin/categories');
}
