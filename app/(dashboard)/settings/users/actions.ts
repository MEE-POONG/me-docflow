'use server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { DocumentActor } from '@/lib/document-actor'
import { CompanyUserRole } from '@prisma/client'

async function manager(actor: DocumentActor, password?: string) {
  const user = await prisma.companyUser.findFirst({ where: { companyId: actor.companyId, email: { equals: actor.userEmail.trim(), mode: 'insensitive' }, status: 'ACTIVE' } })
  if (!user) throw new Error('กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าของหรือผู้ดูแลบริษัทที่ลงทะเบียนไว้ เพื่อจัดการผู้ใช้งาน')
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    // Older registration assigned occupation roles even to the company creator.
    const [company, firstUser, existingAdmin] = await Promise.all([
      prisma.company.findUnique({ where: { id: user.companyId }, select: { email: true } }),
      prisma.companyUser.findFirst({ where: { companyId: user.companyId }, orderBy: { createdAt: 'asc' }, select: { id: true } }),
      prisma.companyUser.findFirst({ where: { companyId: user.companyId, role: { in: ['OWNER', 'ADMIN'] }, status: 'ACTIVE' }, select: { id: true } }),
    ])
    if (existingAdmin || firstUser?.id !== user.id || company?.email?.toLowerCase() !== user.email.toLowerCase()) throw new Error('เฉพาะผู้ดูแลหรือบัญชีที่ลงทะเบียนบริษัทเท่านั้นที่จัดการผู้ใช้ได้')
  }
  if (password !== undefined && (!password || !await bcrypt.compare(password, user.passwordHash))) throw new Error('รหัสผ่านผู้ดูแลไม่ถูกต้อง')
  return user
}
const selectUser = { id: true, name: true, email: true, role: true, status: true, companyId: true } as const
const present = (user: { id: string; name: string; email: string; role: string; status: string; companyId: string }) => ({ id: user.id, companyId: user.companyId, name: user.name, email: user.email, fullName: user.name, role: user.role === 'STAFF' ? 'employee' : user.role.toLowerCase(), status: user.status === 'ACTIVE' ? 'active' as const : 'inactive' as const })

export async function getCompanyUsers(actor: DocumentActor) {
  const user = await manager(actor)
  return (await prisma.companyUser.findMany({ where: { companyId: user.companyId, status: { not: 'DELETED' } }, select: selectUser, orderBy: { name: 'asc' } })).map(present)
}

export async function saveCompanyUser(actor: DocumentActor, input: { id?: string; fullName: string; email: string; password: string; role: string; status: string; adminPassword: string }) {
  try {
    const admin = await manager(actor, input.adminPassword)
    const roles: Record<string, CompanyUserRole> = { owner: 'OWNER', admin: 'ADMIN', accountant: 'ACCOUNTANT', employee: 'STAFF', accounting_firm: 'ACCOUNTANT', student: 'VIEWER', finance: 'FINANCE', hr: 'HR', operation: 'OPERATION', staff: 'STAFF', viewer: 'VIEWER' }
    if (!input.fullName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || !roles[input.role] || !['active', 'inactive'].includes(input.status)) throw new Error('ข้อมูลผู้ใช้งานไม่ถูกต้อง')
    const id = input.id && /^[a-f\d]{24}$/i.test(input.id) ? input.id : undefined
    const current = id ? await prisma.companyUser.findFirst({ where: { id, companyId: admin.companyId } }) : null
    if (id && !current) throw new Error('ไม่พบผู้ใช้ในบริษัทนี้')
    if (current?.role === 'OWNER' && (roles[input.role] !== 'OWNER' || input.status !== 'active')) throw new Error('ไม่สามารถปิดใช้งานหรือลดสิทธิ์เจ้าของบริษัทจากหน้านี้')
    if ((roles[input.role] === 'OWNER' || current?.role === 'OWNER') && admin.role !== 'OWNER') throw new Error('เฉพาะเจ้าของบริษัทที่จัดการสิทธิ์เจ้าของได้')
    if ((!id || input.password) && input.password.length < 6) throw new Error('รหัสผ่านผู้ใช้ต้องมีอย่างน้อย 6 ตัวอักษร')
    const data = { name: input.fullName.trim(), email: input.email.trim().toLowerCase(), role: roles[input.role], status: input.status === 'active' ? 'ACTIVE' as const : 'SUSPENDED' as const,
      ...(input.password ? { passwordHash: await bcrypt.hash(input.password, 12) } : {}) }
    const user = id ? await prisma.companyUser.update({ where: { id, companyId: admin.companyId }, data, select: selectUser })
      : await prisma.companyUser.create({ data: { ...data, companyId: admin.companyId, passwordHash: data.passwordHash! }, select: selectUser })
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
