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

export async function getPartners() {
  const companyId = await getDefaultCompanyId();
  return prisma.businessPartner.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createPartner(data: {
  type: 'CUSTOMER' | 'VENDOR';
  name: string;
  taxId?: string;
  branchCode?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}) {
  const companyId = await getDefaultCompanyId();
  await prisma.businessPartner.create({
    data: {
      ...data,
      companyId,
    }
  });
  revalidatePath('/organizations');
}

export async function updatePartner(id: string, data: {
  type: 'CUSTOMER' | 'VENDOR';
  name: string;
  taxId?: string;
  branchCode?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}) {
  const companyId = await getDefaultCompanyId();
  await prisma.businessPartner.update({
    where: { id, companyId },
    data,
  });
  revalidatePath('/organizations');
}

export async function deletePartner(id: string) {
  const companyId = await getDefaultCompanyId();
  await prisma.businessPartner.delete({
    where: { id, companyId }
  });
  revalidatePath('/organizations');
}
