import { requireDocumentUser } from '@/lib/document-access'
import { prisma } from '@/lib/prisma'
export async function GET() {
  try {
    const user = await requireDocumentUser()
    const memberships = await prisma.companyUser.findMany({
      where: { email: { equals: user.email, mode: 'insensitive' }, status: 'ACTIVE', company: { is: { status: 'ACTIVE' } } },
      select: { companyId: true, role: true, company: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    })
    const companies = memberships.map(membership => ({
      id: membership.companyId,
      companyName: membership.company.name,
      ownerEmail: user.email,
      isActive: membership.companyId === user.companyId,
      role: membership.role.toLowerCase(),
    }))
    return Response.json({ user: { id: user.id, name: user.name, fullName: user.name, email: user.email, phone: user.phone, companyId: user.companyId, companyName: user.company.name, departmentId: user.departmentId, position: user.position, role: user.role.toLowerCase(), status: 'active' }, companies }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({error: 'กรุณาเข้าสู่ระบบใหม่'}, {status:401}) }
}
