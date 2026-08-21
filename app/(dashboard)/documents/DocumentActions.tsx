'use client'

import { useTransition } from 'react'
import { Edit2, Trash2, Loader2, FileText, Send } from 'lucide-react'
import Link from 'next/link'
import { deleteDocument, submitDocument } from '@/app/actions/documents'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function DocumentActions({ id, title, status }: { id: string, title: string, status?: string }) {
  const [isPending, startTransition] = useTransition()
  const { t } = useLanguage()

  const handleDelete = () => {
    if (confirm(`${t.documentsList.confirmDeleteDoc} (${title})`)) {
      startTransition(async () => {
        const result = await deleteDocument(id)
        if (!result.success) {
          alert(t.documentsList.deleteError)
        }
      })
    }
  }

  const handleSubmit = () => {
    if (confirm(`คุณต้องการยื่นขออนุมัติเอกสารนี้ใช่หรือไม่? (${title})`)) {
      startTransition(async () => {
        const result = await submitDocument(id)
        if (!result.success) {
          alert('เกิดข้อผิดพลาดในการยื่นขออนุมัติ')
        }
      })
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/documents/${id}`}
        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
        title={t.documentsList.viewDetails}
      >
        <FileText className="w-4 h-4" />
      </Link>
      
      {(!status || status === 'DRAFT' || status === 'REJECTED') && (
        <>
          <Link
            href={`/documents/${id}/edit`}
            className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
            title={t.common.edit}
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors disabled:opacity-50"
            title="ยื่นขออนุมัติ"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </>
      )}

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors disabled:opacity-50"
        title={t.common.delete}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  )
}
