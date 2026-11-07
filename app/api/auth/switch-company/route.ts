import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createProfileSession, readProfileSession } from '@/lib/profile-session'

export async function POST(request: Request) {
  try {
    const session = await readProfileSession()
    if (!session) return Response.json({ error: 'กรุณาเข้าสู่ระบบใหม่' }, { status: 401 })

    const body = await request.json()
    const companyId = typeof body?.companyId === 'string' ? body.companyId : ''
    if (!/^[a-f\d]{24}$/i.test(companyId)) return Response.json({ error: 'บริษัทที่เลือกไม่ถูกต้อง' }, { status: 400 })
    if (typeof body?.password !== 'string' || !body.password || body.password.length > 200) {
      return Response.json({ error: 'กรุณากรอกรหัสผ่านบริษัทที่เลือก' }, { status: 400 })
    }

    const currentUser = await prisma.companyUser.findFirst({
      where: { id: session.userId, companyId: session.companyId, status: 'ACTIVE', company: { is: { status: 'ACTIVE' } } },
      select: { email: true },
    })
    if (!currentUser) return Response.json({ error: 'ไม่พบบัญชีผู้ใช้งานที่กำลังเข้าสู่ระบบ' }, { status: 401 })

    const membership = await prisma.companyUser.findFirst({
      where: { companyId, email: { equals: currentUser.email, mode: 'insensitive' }, status: 'ACTIVE', company: { is: { status: 'ACTIVE' } } },
      include: { company: { select: { name: true } }, department: { select: { name: true } } },
    })
    if (!membership) return Response.json({ error: 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานบริษัทที่เลือก' }, { status: 403 })
    if (!await bcrypt.compare(body.password, membership.passwordHash)) {
      return Response.json({ error: 'รหัสผ่านบริษัทที่เลือกไม่ถูกต้อง' }, { status: 401 })
    }

    await createProfileSession(membership.id, membership.companyId)
    return Response.json({ user: {
      id: membership.id,
      fullName: membership.name,
      name: membership.name,
      email: membership.email,
      phone: membership.phone,
      departmentId: membership.departmentId,
      departmentName: membership.department?.name || null,
      position: membership.position,
      companyId: membership.companyId,
      companyName: membership.company.name,
      role: membership.role.toLowerCase(),
      status: 'active',
    } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'สลับบริษัทไม่สำเร็จ กรุณาลองอีกครั้ง' }, { status: 500 })
  }
}
