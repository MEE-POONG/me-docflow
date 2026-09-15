'use server'
import { prisma } from '@/lib/prisma'
import { requireDocumentAccess } from '@/lib/document-access'
import { revalidatePath } from 'next/cache'

export async function getDocumentAccess(id: string) {
  const { user, document } = await requireDocumentAccess(id, 'manage')
  const employees = await prisma.companyUser.findMany({ where: { companyId: user.companyId, status: 'ACTIVE', ...(document.createdBy?.departmentId ? { departmentId: document.createdBy.departmentId } : { id: document.createdById }) }, select: { id: true, name: true, email: true, position: true, role: true, department: { select: { name: true } } }, orderBy: { name: 'asc' } })
  return { employees, selected: document.editorUserIds, createdById: document.createdById, version: document.updatedAt.toISOString() }
}
export async function saveDocumentAccess(id: string, ids: string[], version: string) {
  try {
    const { user, document } = await requireDocumentAccess(id, 'manage')
    if (!Array.isArray(ids) || ids.length > 500 || ids.some(id => typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id))) throw new Error('รายชื่อผู้ใช้งานไม่ถูกต้อง')
    const selected = [...new Set(ids)]
    const count = await prisma.companyUser.count({ where: { id: { in: selected }, companyId: user.companyId, status: 'ACTIVE', ...(document.createdBy?.departmentId ? { departmentId: document.createdBy.departmentId } : { id: { in: selected.filter(id => id === document.createdById) } }) } })
    if (count !== selected.length) throw new Error('เลือกได้เฉพาะพนักงานที่เปิดใช้งานในแผนกของผู้สร้างเอกสาร')
    if (document.updatedAt.toISOString() !== version) throw new Error('ข้อมูลเปลี่ยนแปลงแล้ว กรุณาปิดและเปิดหน้าสิทธิ์ใหม่')
    await prisma.document.update({ where: { id, companyId: user.companyId, updatedAt: document.updatedAt }, data: { editorUserIds: selected } })
    revalidatePath('/documents')
    revalidatePath('/documents/' + id)
    return { success: true }
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'บันทึกสิทธิ์ไม่สำเร็จ' } }
}
