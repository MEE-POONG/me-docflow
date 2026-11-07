import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requirePayrollViewer } from '@/lib/finance-access'
import { getPayrollOverview } from './actions'
import PayrollClient from './PayrollClient'

export const metadata: Metadata = {
  title: 'เงินเดือนและสลิป | ME Docflow',
  description: 'สร้างรอบจ่ายเงินเดือนและดูสลิปสำหรับพนักงาน',
}

export default async function PayrollPage() {
  const user = await requirePayrollViewer().catch(() => null)
  if (!user) redirect('/login')
  const data = await getPayrollOverview()
  return <PayrollClient data={data} companyName={user.company.name} />
}
