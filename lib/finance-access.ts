import { requireDocumentUser } from '@/lib/document-access'

const ACCOUNTING_ROLES = new Set(['OWNER', 'ADMIN', 'ACCOUNTANT', 'FINANCE'])
const PAYROLL_MANAGER_ROLES = new Set(['OWNER', 'ADMIN', 'ACCOUNTANT', 'FINANCE', 'HR'])

export function canManageAccounting(role: string) {
  return ACCOUNTING_ROLES.has(role)
}

export function canManagePayroll(role: string) {
  return PAYROLL_MANAGER_ROLES.has(role)
}

export async function getFinanceCapabilities() {
  const user = await requireDocumentUser().catch(() => null)
  return {
    canManageAccounting: !!user && canManageAccounting(user.role),
    canManagePayroll: !!user && canManagePayroll(user.role),
    canViewPayroll: !!user,
  }
}

export async function requireAccountingManager() {
  const user = await requireDocumentUser()
  if (!canManageAccounting(user.role)) throw new Error('เฉพาะเจ้าของบริษัท ผู้ดูแล ฝ่ายบัญชี หรือฝ่ายการเงินเท่านั้น')
  return user
}

export async function requirePayrollManager() {
  const user = await requireDocumentUser()
  if (!canManagePayroll(user.role)) throw new Error('เฉพาะเจ้าของบริษัท ผู้ดูแล ฝ่ายบัญชี ฝ่ายการเงิน หรือฝ่ายบุคคลเท่านั้น')
  return user
}

export async function requirePayrollViewer() {
  return requireDocumentUser()
}
