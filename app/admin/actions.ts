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
