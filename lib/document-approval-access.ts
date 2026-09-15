import { prisma } from '@/lib/prisma'
import { readProfileSession } from '@/lib/profile-session'

export async function getDocumentApprover() {
  const session = await readProfileSession()
  if (!session) return null
  return prisma.companyUser.findFirst({
    where: { id: session.userId, companyId: session.companyId, status: 'ACTIVE', position: 'หัวหน้า' },
    select: { id: true, companyId: true },
  })
}
export async function requireDocumentApprover() {
  const user = await getDocumentApprover()
  if (!user) throw new Error('เฉพาะผู้มีตำแหน่งหัวหน้าเท่านั้นที่อนุมัติเอกสารได้')
  return user
}
