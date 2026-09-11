export type DocumentActor = { companyId: string; userEmail: string }

export function getDocumentActor(): DocumentActor {
  if (typeof window === 'undefined') return { companyId: '', userEmail: '' }
  try {
    const user = JSON.parse(localStorage.getItem('me_docflow_current_user') || '{}')
    return { companyId: user.companyId || '', userEmail: user.email || '' }
  } catch {
    return { companyId: '', userEmail: '' }
  }
}
