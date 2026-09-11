import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { issueOtp, verifyOtp, OtpError } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/mail'

export async function POST(request: Request) {
  try {
    const input = await request.json()
    if (typeof input.identifier !== 'string') return Response.json({ error: 'กรุณาระบุบัญชี' }, { status: 400 })
    const user = await prisma.companyUser.findFirst({ where: { status: 'ACTIVE', OR: [{ email: { equals: input.identifier.trim(), mode: 'insensitive' } }, { phone: input.identifier.trim() }] } })
    if (!user) return Response.json({ error: 'ไม่พบบัญชีในฐานข้อมูล กรุณาให้ผู้ดูแลบริษัทตรวจสอบผู้ใช้งาน' }, { status: 404 })
    const email = user.email.toLowerCase()
    if (input.password === undefined) {
      await issueOtp(email, sendOtpEmail)
      return Response.json({ email })
    }
    if (typeof input.password !== 'string' || input.password.length < 6 || input.password.length > 200) return Response.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 })
    verifyOtp(email, input.otp)
    const passwordHash = await bcrypt.hash(input.password, 12)
    await prisma.companyUser.updateMany({ where: { email: { equals: email, mode: 'insensitive' }, status: 'ACTIVE' }, data: { passwordHash } })
    return Response.json({ success: true })
  } catch (error) { return Response.json({ error: error instanceof OtpError ? error.message : 'ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง' }, { status: error instanceof OtpError ? error.status : 503 }) }
}
