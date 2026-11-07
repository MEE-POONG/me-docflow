'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { storeCompanySession } from '@/lib/company-session-client'
export default function SessionSync() {
  const pathname = usePathname()
  useEffect(() => {
    let active = true
    async function sync() {
      try {
        const response = await fetch('/api/auth/me', {cache:'no-store'})
        if (!response.ok) return
        const {user, companies} = await response.json()
        if (!active) return
        storeCompanySession(user, companies)
      } catch { /* Retain current display during transient connection failures. */ }
    }
    void sync(); window.addEventListener('focus',sync)
    return () => { active=false; window.removeEventListener('focus',sync) }
  },[pathname])
  return null
}
