import Link from 'next/link'
import { UserRound, Building2, ShieldCheck } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { readProfileSession } from '@/lib/profile-session'
import { getCompanyUserRole, normalizeLegacyCompanyRole } from '@/lib/company-user-roles'

export default async function ProfilePage() {
  const session = await readProfileSession()
  if (!session) return <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
    <UserRound className="mx-auto mb-4 h-10 w-10 text-emerald-600" />
    <h1 className="text-xl font-bold">โปรไฟล์ของฉัน</h1>
    <p className="my-4 text-sm text-gray-500">กรุณาเข้าสู่ระบบเพื่อดูข้อมูลส่วนตัว หากเข้าสู่ระบบค้างไว้ก่อนหน้านี้ ให้เข้าสู่ระบบใหม่หนึ่งครั้ง</p>
    <Link href="/login" className="inline-block rounded-lg bg-emerald-600 px-5 py-2 text-white">เข้าสู่ระบบ</Link>
  </div>

  const user = await prisma.companyUser.findFirst({
    where: { id: session.userId, companyId: session.companyId, status: 'ACTIVE' },
    select: { name: true, email: true, phone: true, position: true, role: true, createdAt: true,
      company: { select: { name: true } }, department: { select: { name: true, companyId: true } } },
  })
  if (!user) return <div role="alert" className="rounded-xl bg-amber-50 p-6 text-amber-900">ไม่พบบัญชีที่เปิดใช้งาน กรุณาติดต่อผู้ดูแลบริษัท หรือ <Link href="/login" className="underline">เข้าสู่ระบบใหม่</Link></div>

  const details = [
    ['ชื่อ-นามสกุล', user.name], ['อีเมล', user.email], ['เบอร์โทรศัพท์', user.phone],
    ['บริษัท', user.company.name], ['แผนก', user.department?.companyId === session.companyId ? user.department.name : null],
    ['ตำแหน่งงาน', user.position], ['บทบาทการใช้งานระบบ', getCompanyUserRole(normalizeLegacyCompanyRole(user.role))?.label],
    ['วันที่สร้างบัญชี', user.createdAt.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'long', year: 'numeric' })],
  ]
  return <main className="mx-auto max-w-4xl space-y-6 py-4">
    <header><p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600">บัญชีของฉัน</p><h1 className="text-3xl font-bold text-gray-900 dark:text-white">โปรไฟล์ของฉัน</h1><p className="mt-2 text-sm text-gray-500">ข้อมูลส่วนตัวและข้อมูลการทำงานของคุณ</p></header>
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-5 border-b border-gray-100 bg-emerald-50/60 p-6 dark:border-gray-700 dark:bg-emerald-950/20">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-3xl font-bold text-white">{user.name.trim().slice(0, 1) || <UserRound />}</div>
        <div className="min-w-0 flex-1"><h2 className="break-words text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2><p className="mt-1 flex items-center gap-2 text-sm text-gray-500"><Building2 className="h-4 w-4 shrink-0" />{user.company.name}</p></div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"><ShieldCheck className="h-4 w-4" />บัญชีเปิดใช้งาน</span>
      </div>
      <dl className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">{details.map(([label, value]) => <div key={label}><dt className="text-sm text-gray-500">{label}</dt><dd className="mt-1 break-words font-medium text-gray-900 dark:text-gray-100">{value || 'ยังไม่ได้ระบุ'}</dd></div>)}</dl>
    </section>
    <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">หากข้อมูลไม่ถูกต้อง กรุณาติดต่อผู้ดูแลบริษัทเพื่อแก้ไขข้อมูล</p>
  </main>
}
