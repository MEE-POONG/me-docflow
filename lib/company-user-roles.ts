import type { CompanyUserRole } from '@prisma/client'

export const companyUserRoles = [
  { value: 'owner', label: 'เจ้าของบริษัท', databaseRole: 'OWNER' },
  { value: 'admin', label: 'ผู้ดูแลบริษัท', databaseRole: 'ADMIN' },
  { value: 'accountant', label: 'ฝ่ายบัญชี', databaseRole: 'ACCOUNTANT' },
  { value: 'finance', label: 'ฝ่ายการเงิน', databaseRole: 'FINANCE' },
  { value: 'hr', label: 'ฝ่ายบุคคล', databaseRole: 'HR' },
  { value: 'operation', label: 'ฝ่ายปฏิบัติการ', databaseRole: 'OPERATION' },
  { value: 'employee', label: 'พนักงาน', databaseRole: 'STAFF' },
  { value: 'viewer', label: 'ผู้ดูข้อมูล', databaseRole: 'VIEWER' },
] as const satisfies ReadonlyArray<{ value: string; label: string; databaseRole: CompanyUserRole }>

export function getCompanyUserRole(value: string) {
  return companyUserRoles.find(role => role.value === value)
}

/** Preserve the existing permissions of old browser-only accounts when editing. */
export function normalizeLegacyCompanyRole(value: string): string {
  const normalized = value.toLowerCase()
  if (normalized === 'staff') return 'employee'
  if (normalized === 'accounting_firm' || normalized === 'accountant_in') return 'accountant'
  if (normalized === 'student') return 'viewer'
  return getCompanyUserRole(normalized)?.value || ''
}
