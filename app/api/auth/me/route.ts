import { requireDocumentUser } from '@/lib/document-access'
export async function GET() {
  try {
    const user = await requireDocumentUser()
    return Response.json({ user: { id: user.id, name: user.name, fullName: user.name, email: user.email, phone: user.phone, companyId: user.companyId, companyName: user.company.name, departmentId: user.departmentId, position: user.position, role: user.role.toLowerCase(), status: 'active' } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({error: 'กรุณาเข้าสู่ระบบใหม่'}, {status:401}) }
}
