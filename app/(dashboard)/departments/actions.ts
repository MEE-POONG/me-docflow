'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import type { DocumentActor } from '@/lib/document-actor';
import { listCompanyDepartments, requireDepartmentCompany } from '@/lib/company-departments';
import { validateDepartmentPositions } from '@/lib/company-user-positions';

export async function getDepartments(actor?: DocumentActor) {
  if (!actor) return [];
  return listCompanyDepartments(actor);
}

export async function createDepartment(actor: DocumentActor, data: {
  name: string;
  description?: string | null;
  isActive: boolean;
  positions: string[];
}) {
  const companyId = await requireDepartmentCompany(actor);
  
  await prisma.department.create({
    data: {
      ...data,
      positions: validateDepartmentPositions(data.positions),
      companyId,
    }
  });
  revalidatePath('/departments');
}

export async function updateDepartment(id: string, actor: DocumentActor, data: {
  name: string;
  description?: string | null;
  isActive: boolean;
  positions: string[];
}) {
  const companyId = await requireDepartmentCompany(actor);
  const positions = validateDepartmentPositions(data.positions);
  const assignedUsers = await prisma.companyUser.findMany({ where: { companyId, departmentId: id, status: { not: 'DELETED' }, position: { not: null } }, select: { position: true } });
  if (assignedUsers.some(user => user.position && !positions.includes(user.position))) {
    throw new Error('ยังมีผู้ใช้ในตำแหน่งที่นำออก กรุณาเปลี่ยนตำแหน่งของผู้ใช้ก่อน');
  }
  await prisma.department.update({
    where: { id, companyId },
    data: { ...data, positions },
  });
  revalidatePath('/departments');
}

export async function deleteDepartment(id: string, actor: DocumentActor) {
  const companyId = await requireDepartmentCompany(actor);
  await prisma.department.delete({
    where: { id, companyId }
  });
  revalidatePath('/departments');
}
