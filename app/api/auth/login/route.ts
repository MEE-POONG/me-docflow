import { ensureEmployeeCode } from '@/lib/employee-code'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createProfileSession, clearProfileSession } from '@/lib/profile-session'

export async function POST(request: Request) {
  try {
    await clearProfileSession()
    const { identifier, password, companyId } = await request.json()
    if (typeof identifier !== 'string' || typeof password !== 'string' || !password || identifier.length > 254 || password.length > 200) return Response.json({ error: 'กรุณากรอกอีเมลหรือเบอร์โทรและรหัสผ่าน' }, { status: 400 })
    const normalized = identifier.trim().toLowerCase()
    const users = await prisma.companyUser.findMany({ where: { status: 'ACTIVE', OR: [{ email: { equals: normalized, mode: 'insensitive' } }, { phone: identifier.trim() }] }, include: { company: { select: { name: true } }, department: { select: { name: true } } } })
    const matched = []
    for (const user of users) {
      if (await bcrypt.compare(password, user.passwordHash)) matched.push(user)
    }
    if (!companyId && matched.length > 1) return Response.json({ selectCompany: true, companies: matched.map(user => ({ id: user.companyId, name: user.company.name, department: user.department?.name || 'ยังไม่ระบุแผนก', position: user.position || '' })) })
    for (const user of matched) {
      if (companyId && user.companyId !== companyId) continue
      await ensureEmployeeCode(user.id)
      await createProfileSession(user.id, user.companyId)
      return Response.json({ user: { id: user.id, fullName: user.name, name: user.name, email: user.email, phone: user.phone,
        departmentId: user.departmentId, departmentName: user.department?.name || null, position: user.position, companyId: user.companyId, companyName: user.company.name, role: user.role.toLowerCase(), status: 'active' } })
    }
    return Response.json({ error: 'ไม่พบบัญชีที่ใช้งานได้ หรือรหัสผ่านไม่ถูกต้อง หากเพิ่มผู้ใช้ผ่านหน้าเดิม ให้ผู้ดูแลบริษัทบันทึกผู้ใช้นั้นในหน้าจัดการผู้ใช้งานอีกครั้ง' }, { status: 401 })
  } catch { return Response.json({ error: 'เชื่อมต่อระบบเข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง' }, { status: 503 }) }
}
