'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
export default function SessionSync() {
  const pathname = usePathname()
  useEffect(() => {
    let active = true
    async function sync() {
      try {
        const response = await fetch('/api/auth/me', {cache:'no-store'})
        if (!response.ok) return
        const {user} = await response.json()
        if (!active) return
        const value = JSON.stringify(user)
        if (localStorage.getItem('me_docflow_current_user') === value) return
        localStorage.setItem('me_docflow_current_user', value)
        localStorage.setItem('me_docflow_companies', JSON.stringify([{id:user.companyId,companyName:user.companyName,isActive:true}]))
        window.dispatchEvent(new Event('activeCompanyChanged'))
      } catch { /* Retain current display during transient connection failures. */ }
    }
    void sync(); window.addEventListener('focus',sync)
    return () => { active=false; window.removeEventListener('focus',sync) }
  },[pathname])
  return null
}
