'use server';

import { ensureEmployeeCode } from '@/lib/employee-code';
import { requirePeopleManager } from '@/lib/people-access';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { DocumentActor } from '@/lib/document-actor';


type EmployeeManager = Awaited<ReturnType<typeof requirePeopleManager>>;

async function employeeScope(actor?: DocumentActor) {
  const user = await requirePeopleManager(actor);
  const department = user.departmentId ? await prisma.department.findFirst({
    where: { id: user.departmentId, companyId: user.companyId }, select: { id: true },
  }) : null;
  return { user, departmentId: department?.id ?? null };
}

async function validateEmployeeChange(user: EmployeeManager, departmentId: string | null, targetDepartment?: string, id?: string) {
  if (user.role !== 'OWNER' && (!departmentId || targetDepartment !== departmentId)) {
    throw new Error('หัวหน้าจัดการได้เฉพาะพนักงานในแผนกตนเอง');
  }
  if (targetDepartment && !await prisma.department.findFirst({ where: { id: targetDepartment, companyId: user.companyId }, select: { id: true } })) {
    throw new Error('ไม่พบแผนกในบริษัทนี้');
  }
  if (id) {
    const employee = await prisma.employee.findFirst({ where: { id, companyId: user.companyId } });
    if (!employee) throw new Error('ไม่พบพนักงาน');
    // Account departments are authoritative, as in the merged employee directory.
    const account = employee.email ? await prisma.companyUser.findFirst({
      where: { companyId: user.companyId, email: { equals: employee.email.trim(), mode: 'insensitive' }, status: { not: 'DELETED' } },
      select: { departmentId: true },
    }) : null;
    if (user.role !== 'OWNER' && (account ? account.departmentId : employee.departmentId) !== departmentId) {
      throw new Error('หัวหน้าจัดการได้เฉพาะพนักงานในแผนกตนเอง');
    }
  }
}

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

// The directory includes saved employee profiles and users in the selected company.
export async function getEmployees(actor?: DocumentActor) {
  const { user, departmentId: allowedDepartmentId } = await employeeScope(actor);
  const { companyId } = user;
  if (user.role !== 'OWNER' && !allowedDepartmentId) return [];
  const members = await prisma.companyUser.findMany({where:{companyId,status:{not:'DELETED'}},select:{id:true}});
  for (const member of members) await ensureEmployeeCode(member.id);
  const [profiles, users] = await Promise.all([
    prisma.employee.findMany({ where: { companyId }, include: { department: true }, orderBy: { name: 'asc' } }),
    prisma.companyUser.findMany({ where: { companyId, status: { not: 'DELETED' } },
      select: { id: true, name: true, email: true, phone: true, position: true, departmentId: true, department: true, status: true }, orderBy: { name: 'asc' } }),
  ]);
  const byEmail = new Map(users.map(user => [user.email.trim().toLowerCase(), user]));
  const matched = new Set<string>();
  const existing = profiles.map(profile => {
    const user = profile.email ? byEmail.get(profile.email.trim().toLowerCase()) : undefined;
    if (user) matched.add(user.id);
    return { ...profile, ...(user ? { name: user.name, email: user.email, phone: user.phone || profile.phone, position: user.position, departmentId: user.departmentId, department: user.department, status: user.status } : {}), companyUserId: user?.id ?? null };
  });
  const userRows = users.filter(user => !matched.has(user.id)).map(user => ({
    ...user, id: 'user:' + user.id, companyUserId: user.id,
    code: null, salarySatang: null, startDate: null, endDate: null,
  }));
  return [...existing, ...userRows].map(row => ({ ...row,
    department: row.department?.companyId === companyId ? row.department : null,
    departmentId: row.department?.companyId === companyId ? row.departmentId : null,
  })).filter(row => user.role === 'OWNER' || row.departmentId === allowedDepartmentId).sort((a, b) => a.name.localeCompare(b.name, 'th'));
}

export async function getDepartments(actor?: DocumentActor) {
  const { user, departmentId } = await employeeScope(actor);
  if (user.role !== 'OWNER' && !departmentId) return [];
  return prisma.department.findMany({ where: { companyId: user.companyId, ...(user.role === 'OWNER' ? {} : { id: departmentId! }) }, orderBy: { name: 'asc' } });
}

export async function createEmployee(actor: DocumentActor, data: {
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
  const { user, departmentId: allowedDepartmentId } = await employeeScope(actor);
  const { companyId } = user;
  await validateEmployeeChange(user, allowedDepartmentId, data.departmentId);
  
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

export async function updateEmployee(id: string, actor: DocumentActor, data: {
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
  const { user, departmentId: allowedDepartmentId } = await employeeScope(actor);
  const { companyId } = user;
  await validateEmployeeChange(user, allowedDepartmentId, data.departmentId, id);
  
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

export async function deleteEmployee(id: string, actor: DocumentActor) {
  const { user, departmentId: allowedDepartmentId } = await employeeScope(actor);
  const { companyId } = user;
  await validateEmployeeChange(user, allowedDepartmentId, allowedDepartmentId ?? undefined, id);
  await prisma.employee.delete({
    where: { id, companyId }
  });
  revalidatePath('/employees');
}
