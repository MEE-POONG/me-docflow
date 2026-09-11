'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { submitDocument } from '@/app/actions/documents'
import { getDocumentActor } from '@/lib/document-actor'

export function SubmitForApprovalButton({ documentId, title, allowedSignerEmail }: { documentId: string; title: string; allowedSignerEmail: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [canSubmit, setCanSubmit] = useState(false)

  useEffect(() => {
    const actor = getDocumentActor()
    setCanSubmit(actor.userEmail.trim().toLowerCase() === allowedSignerEmail.trim().toLowerCase())
  }, [allowedSignerEmail])

  if (!canSubmit) return null

  return <button
    type="button"
    disabled={isPending}
    onClick={() => {
      if (!confirm(`คุณต้องการยื่นขออนุมัติเอกสารนี้ใช่หรือไม่? (${title})`)) return
      startTransition(async () => {
        const result = await submitDocument(documentId, getDocumentActor())
        if (!result.success) {
          alert(result.error || 'เกิดข้อผิดพลาดในการยื่นขออนุมัติ')
          return
        }
        router.refresh()
      })
    }}
    className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
  >
    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
    {isPending ? 'กำลังยื่น...' : 'ยื่นขออนุมัติ'}
  </button>
}
