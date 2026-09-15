import { prisma } from '@/lib/prisma'
import { readProfileSession } from '@/lib/profile-session'
import type { DocumentActor } from '@/lib/document-actor'

// Read current permissions from the authenticated account on every request.
export async function getPeopleManager() {
  const session = await readProfileSession()
  if (!session) return null
  const user = await prisma.companyUser.findFirst({
    where: { id: session.userId, companyId: session.companyId, status: 'ACTIVE' },
    select: { id: true, companyId: true, email: true, role: true, position: true, departmentId: true, passwordHash: true },
  })
  return user && (user.role === 'OWNER' || user.position === 'หัวหน้า') ? user : null
}

export async function requirePeopleManager(actor?: DocumentActor) {
  const user = await getPeopleManager()
  if (!user) throw new Error('เฉพาะเจ้าของบริษัทหรือหัวหน้าเท่านั้นที่ดูและจัดการข้อมูลผู้ใช้งานและพนักงานได้')
  if (actor && (actor.companyId !== user.companyId || actor.userEmail?.trim().toLowerCase() !== user.email.toLowerCase())) {
    throw new Error('บัญชีหรือบริษัทไม่ตรงกับการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่')
  }
  return user
}
