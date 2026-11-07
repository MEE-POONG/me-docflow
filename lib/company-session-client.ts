export type SessionCompany = {
  id: string
  companyName: string
  ownerEmail: string
  isActive: boolean
  role?: string
}

type SessionCompanyUser = { companyId: string; companyName: string; email: string; role?: string }

function readStoredCompanies(): SessionCompany[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('me_docflow_companies') || '[]')
    if (!Array.isArray(value)) return []
    return value.filter((company): company is SessionCompany =>
      company !== null && typeof company === 'object' &&
      typeof company.id === 'string' && typeof company.companyName === 'string' &&
      typeof company.ownerEmail === 'string',
    )
  } catch {
    return []
  }
}

// A server supplied list replaces stale memberships; saves and switches can retain
// the last server supplied list while updating the active company.
export function storeCompanySession(user: SessionCompanyUser, availableCompanies?: SessionCompany[]) {
  const email = user.email.toLowerCase()
  const companyMap = new Map<string, SessionCompany>()
  for (const company of availableCompanies ?? readStoredCompanies()) {
    if (company.ownerEmail.toLowerCase() !== email) continue
    companyMap.set(company.id, { ...company, isActive: company.id === user.companyId })
  }
  companyMap.set(user.companyId, {
    ...companyMap.get(user.companyId),
    id: user.companyId,
    companyName: user.companyName,
    ownerEmail: user.email,
    isActive: true,
    role: user.role?.toLowerCase() || companyMap.get(user.companyId)?.role,
  })

  const companies = [...companyMap.values()]
  const userValue = JSON.stringify(user)
  const companiesValue = JSON.stringify(companies)
  const changed = localStorage.getItem('me_docflow_current_user') !== userValue ||
    localStorage.getItem('me_docflow_companies') !== companiesValue
  localStorage.setItem('me_docflow_current_user', userValue)
  localStorage.setItem('me_docflow_user_session', 'true')
  localStorage.setItem('me_docflow_companies', companiesValue)
  if (changed) window.dispatchEvent(new Event('activeCompanyChanged'))
  return companies
}
