import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AccountingClient from './AccountingClient'
import { getAccountingOverview } from './actions'
import { canManageAccounting } from '@/lib/finance-access'
import { requireDocumentUser } from '@/lib/document-access'

export const metadata: Metadata = {
  title: 'บัญชีบริษัท | ME Docflow',
  description: 'บันทึกรายรับ รายจ่าย สมุดรายวัน และตรวจงบทดลองของบริษัท',
}

export default async function AccountingPage() {
  const user = await requireDocumentUser().catch(() => null)
  if (!user) redirect('/login')
  if (!canManageAccounting(user.role)) redirect('/dashboard')

  const data = await getAccountingOverview()
  return <AccountingClient
    year={data.year}
    initialAccounts={data.accounts.map(({ id, code, name, type, isActive }) => ({ id, code, name, type, isActive }))}
    initialEntries={data.entries.map(({ id, entryDate, referenceNo, entryType, status, settlementStatus, description, counterpartyName, amountSatang, lines }) => ({ id, entryDate, referenceNo, entryType, status, settlementStatus, description, counterpartyName, amountSatang, lines }))}
    trialBalance={data.summary}
  />
}
