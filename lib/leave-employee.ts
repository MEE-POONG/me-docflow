import { ensureEmployeeCode } from '@/lib/employee-code'
import { prisma } from '@/lib/prisma'
import { requireDocumentUser, requireDocumentAccess } from '@/lib/document-access'

export async function leaveEmployeeFields(documentId?: string) {
  const access = documentId ? await requireDocumentAccess(documentId, 'edit') : null
  const actor = access?.user || await requireDocumentUser()
  const userId = access?.document.createdById || actor.id
  const user = await prisma.companyUser.findFirst({ where: { id: userId, companyId: actor.companyId }, select: { name: true, email: true, position: true, department: { select: { name: true, companyId: true } } } })
  if (!user) throw new Error('ไม่พบข้อมูลพนักงานผู้สร้างเอกสาร')
  const employeeCode = await ensureEmployeeCode(userId)
  return { leave_employeeName: user.name, leave_employeeId: employeeCode, leave_position: user.position || '', leave_department: user.department?.companyId === actor.companyId ? user.department.name : '' }
}

export async function applyLeaveEmployee(dataJson: string, documentTypeId: string, documentId?: string) {
  const type = await prisma.documentType.findUnique({ where: { id: documentTypeId }, select: { name: true } })
  if (!type || (!type.name.includes('ลางาน') && !type.name.toLowerCase().includes('leave'))) return dataJson
  const fields = await leaveEmployeeFields(documentId)
  return JSON.stringify({ ...JSON.parse(dataJson), ...fields })
}
