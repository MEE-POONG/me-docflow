import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { readProfileSession } from '@/lib/profile-session'
import type { DocumentActor } from '@/lib/document-actor'

export async function requireDocumentUser(actor?: DocumentActor) {
  const session = await readProfileSession()
  if (!session) throw new Error('กรุณาเข้าสู่ระบบใหม่')
  const user = await prisma.companyUser.findFirst({ where: { id: session.userId, companyId: session.companyId, status: 'ACTIVE' }, include: { company: true } })
  if (!user || (actor && (actor.companyId !== user.companyId || actor.userEmail?.trim().toLowerCase() !== user.email.toLowerCase()))) throw new Error('บัญชีหรือบริษัทไม่ตรงกับการเข้าสู่ระบบ')
  return user
}
export function documentVisibilityWhere(user: { id: string; companyId: string; role: string; departmentId?: string | null }): Prisma.DocumentWhereInput {
  if (user.role === 'OWNER') return { companyId: user.companyId }
  // Unassigned users are not a shared department.
  return { companyId: user.companyId, ...(user.departmentId
    ? { createdBy: { is: { companyId: user.companyId, departmentId: user.departmentId } } }
    : { createdById: user.id }) }
}
export function documentPermissions(user: { id: string; companyId: string; role: string; position: string | null }, doc: { companyId: string; createdById: string; editorUserIds?: string[] }) {
  const canManage = user.companyId === doc.companyId && (doc.createdById === user.id || user.role === 'OWNER' || user.position === 'หัวหน้า')
  return { canManage, canEdit: user.companyId === doc.companyId && (canManage || !!doc.editorUserIds?.includes(user.id)) }
}
export async function requireDocumentAccess(id: string, mode: 'view' | 'edit' | 'manage' = 'view', actor?: DocumentActor) {
  const user = await requireDocumentUser(actor)
  const document = await prisma.document.findFirst({ where: { ...documentVisibilityWhere(user), id }, include: { createdBy: { select: { departmentId: true } } } })
  if (!document) throw new Error('ไม่พบเอกสารในบริษัทนี้')
  const permissions = documentPermissions(user, document)
  if ((mode === 'edit' && !permissions.canEdit) || (mode === 'manage' && !permissions.canManage)) throw new Error('คุณไม่ได้รับสิทธิ์ดำเนินการกับเอกสารนี้')
  return { user, document, ...permissions }
}
