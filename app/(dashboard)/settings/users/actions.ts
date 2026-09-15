'use server'
import { requirePeopleManager } from '@/lib/people-access'
import { ensureEmployeeCode } from '@/lib/employee-code'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { DocumentActor } from '@/lib/document-actor'
import { getCompanyUserRole } from '@/lib/company-user-roles'
import { isCompanyUserPosition } from '@/lib/company-user-positions'
import { listCompanyDepartments } from '@/lib/company-departments'

async function manager(actor: DocumentActor, password?: string) {
  const user = await requirePeopleManager(actor)
  if (password !== undefined && (!password || !await bcrypt.compare(password, user.passwordHash))) throw new Error('รหัสผ่านผู้ดูแลไม่ถูกต้อง')
  return user
}
const selectUser = { id: true, name: true, email: true, role: true, status: true, companyId: true, position: true, departmentId: true, department: { select: { id: true, name: true, companyId: true } } } as const
const present = (user: { id: string; name: string; email: string; role: string; status: string; companyId: string; position: string | null; departmentId: string | null; department: { id: string; name: string; companyId: string } | null }) => ({ id: user.id, companyId: user.companyId, name: user.name, email: user.email, fullName: user.name, role: user.role === 'STAFF' ? 'employee' : user.role.toLowerCase(), status: user.status === 'ACTIVE' ? 'active' as const : 'inactive' as const,
  position: user.position, departmentId: user.department?.companyId === user.companyId ? user.departmentId : null,
  departmentName: user.department?.companyId === user.companyId ? user.department.name : null,
})

export async function getCompanyUsers(actor: DocumentActor) {
  const user = await manager(actor)
  return (await prisma.companyUser.findMany({ where: { companyId: user.companyId, status: { not: 'DELETED' } }, select: selectUser, orderBy: { name: 'asc' } })).map(present)
}

export async function getCompanyUserDepartments(actor: DocumentActor) {
  await requirePeopleManager(actor)
  return (await listCompanyDepartments(actor, true)).map(({ id, name, positions }) => ({ id, name, positions }))
}

export async function saveCompanyUser(actor: DocumentActor, input: { id?: string; fullName: string; email: string; password: string; role: string; status: string; adminPassword: string; departmentId?: string; position?: string }) {
  try {
    const admin = await manager(actor, input.adminPassword)
    const selectedRole = getCompanyUserRole(input.role)
    if (!selectedRole) throw new Error('กรุณาเลือกบทบาทภายในบริษัทที่กำหนดไว้')
    const role = selectedRole.databaseRole
    if (!input.fullName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || !['active', 'inactive'].includes(input.status)) throw new Error('ข้อมูลผู้ใช้งานไม่ถูกต้อง')
    const id = input.id && /^[a-f\d]{24}$/i.test(input.id) ? input.id : undefined
    const current = id ? await prisma.companyUser.findFirst({ where: { id, companyId: admin.companyId } }) : null
    if (id && !current) throw new Error('ไม่พบผู้ใช้ในบริษัทนี้')
    const departmentId = input.departmentId === undefined ? current?.departmentId ?? null : input.departmentId || null
    const position = input.position === undefined ? current?.position ?? null : input.position || null
    if (position && !isCompanyUserPosition(position)) throw new Error('กรุณาเลือกตำแหน่งงานที่กำหนดไว้')
    if (position && !departmentId) throw new Error('กรุณาเลือกแผนกก่อนเลือกตำแหน่งงาน')
    if (departmentId) {
      if (!/^[a-f\d]{24}$/i.test(departmentId)) throw new Error('แผนกที่เลือกไม่ถูกต้อง')
      const department = await prisma.department.findFirst({ where: { id: departmentId, companyId: admin.companyId, isActive: true }, select: { id: true, positions: true } })
      if (!department) throw new Error('กรุณาเลือกแผนกที่เปิดใช้งานภายในบริษัทนี้')
      if (position && !department.positions.includes(position)) throw new Error('ตำแหน่งที่เลือกไม่ได้อยู่ในแผนกนี้ กรุณาเลือกใหม่')
    }
    if (current?.role === 'OWNER' && (role !== 'OWNER' || input.status !== 'active')) throw new Error('ไม่สามารถปิดใช้งานหรือลดสิทธิ์เจ้าของบริษัทจากหน้านี้')
    if ((role === 'OWNER' || current?.role === 'OWNER') && admin.role !== 'OWNER') throw new Error('เฉพาะเจ้าของบริษัทที่จัดการสิทธิ์เจ้าของได้')
    if ((!id || input.password) && input.password.length < 6) throw new Error('รหัสผ่านผู้ใช้ต้องมีอย่างน้อย 6 ตัวอักษร')
    const data = { name: input.fullName.trim(), email: input.email.trim().toLowerCase(), role, departmentId, position, status: input.status === 'active' ? 'ACTIVE' as const : 'SUSPENDED' as const,
      ...(input.password ? { passwordHash: await bcrypt.hash(input.password, 12) } : {}) }
    const user = id ? await prisma.companyUser.update({ where: { id, companyId: admin.companyId }, data, select: selectUser })
      : await prisma.companyUser.create({ data: { ...data, companyId: admin.companyId, passwordHash: data.passwordHash! }, select: selectUser })
    await ensureEmployeeCode(user.id, current?.email)
    return { success: true, user: present(user) }
  } catch (error) { return { success: false, error: (error as { code?: string }).code === 'P2002' ? 'อีเมลนี้มีอยู่ในบริษัทแล้ว' : error instanceof Error ? error.message : 'บันทึกผู้ใช้ไม่สำเร็จ' } }
}

export async function deactivateCompanyUser(actor: DocumentActor, id: string, adminPassword: string) {
  try {
    const admin = await manager(actor, adminPassword)
    const target = await prisma.companyUser.findFirst({ where: { id, companyId: admin.companyId } })
    if (!target || target.id === admin.id || target.role === 'OWNER') throw new Error('ไม่สามารถลบบัญชีตนเองหรือเจ้าของบริษัทได้')
    await prisma.companyUser.update({ where: { id, companyId: admin.companyId }, data: { status: 'DELETED' } })
    return { success: true }
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'ลบผู้ใช้ไม่สำเร็จ' } }
}
