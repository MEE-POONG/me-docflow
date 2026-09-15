import { prisma } from '@/lib/prisma'
import type { DocumentActor } from '@/lib/document-actor'

export async function requireDepartmentCompany(actor: DocumentActor) {
  if (!actor.companyId || !actor.userEmail) throw new Error('กรุณาเลือกบริษัทและเข้าสู่ระบบ')
  const member = await prisma.companyUser.findFirst({
    where: { companyId: actor.companyId, email: { equals: actor.userEmail.trim(), mode: 'insensitive' }, status: 'ACTIVE' },
    select: { companyId: true },
  })
  if (!member) throw new Error('ไม่พบสิทธิ์ใช้งานบริษัทที่เลือก')
  return member.companyId
}

export async function listCompanyDepartments(actor: DocumentActor, activeOnly = false) {
  const companyId = await requireDepartmentCompany(actor)
  return prisma.department.findMany({
    where: { companyId, ...(activeOnly ? { isActive: true } : {}) },
    orderBy: { name: 'asc' },
  })
}
