'use client'

import { useTransition } from 'react'
import { Edit2, Trash2, Loader2, FileText } from 'lucide-react'
import Link from 'next/link'
import { deleteDocument } from '@/app/actions/documents'

export default function DocumentActions({ id, title }: { id: string, title: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm(`คุณต้องการลบเอกสาร "${title}" ใช่หรือไม่?`)) {
      startTransition(async () => {
        const result = await deleteDocument(id)
        if (!result.success) {
          alert('เกิดข้อผิดพลาด ไม่สามารถลบเอกสารได้')
        }
      })
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link 
        href={`/documents/${id}`} 
        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" 
        title="ดูรายละเอียด"
      >
        <FileText className="w-4 h-4" />
      </Link>
      <Link 
        href={`/documents/${id}/edit`} 
        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors" 
        title="แก้ไข"
      >
        <Edit2 className="w-4 h-4" />
      </Link>
      <button 
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors disabled:opacity-50" 
        title="ลบ"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  )
}
