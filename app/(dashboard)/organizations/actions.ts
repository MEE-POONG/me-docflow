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

export async function getPartners(email?: string) {
  if (!email) return [];
  const companyId = await getCompanyIdByEmail(email);
  return prisma.businessPartner.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createPartner(email: string, data: {
  type: 'CUSTOMER' | 'VENDOR';
  name: string;
  taxId?: string;
  branchCode?: string;
  partnerEmail?: string;
  phone?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}) {
  const companyId = await getCompanyIdByEmail(email);
  await prisma.businessPartner.create({
    data: {
      ...data,
      email: data.partnerEmail,
      companyId,
    }
  });
  revalidatePath('/organizations');
}

export async function updatePartner(id: string, email: string, data: {
  type: 'CUSTOMER' | 'VENDOR';
  name: string;
  taxId?: string;
  branchCode?: string;
  partnerEmail?: string;
  phone?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}) {
  const companyId = await getCompanyIdByEmail(email);
  await prisma.businessPartner.update({
    where: { id, companyId },
    data: {
      ...data,
      email: data.partnerEmail,
    },
  });
  revalidatePath('/organizations');
}

export async function deletePartner(id: string, email: string) {
  const companyId = await getCompanyIdByEmail(email);
  await prisma.businessPartner.delete({
    where: { id, companyId }
  });
  revalidatePath('/organizations');
}
