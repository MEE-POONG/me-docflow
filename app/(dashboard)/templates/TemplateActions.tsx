'use client'

import { useTransition } from 'react'
import { Edit2, Trash2, Loader2, Settings } from 'lucide-react'
import Link from 'next/link'
import { deleteTemplate } from './actions'

export default function TemplateActions({ id, name }: { id: string, name: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบเทมเพลต "${name}"?\nการกระทำนี้ไม่สามารถเลิกทำได้`)) {
      startTransition(async () => {
        try {
          await deleteTemplate(id)
        } catch (error) {
          console.error(error)
          alert('เกิดข้อผิดพลาด ไม่สามารถลบเทมเพลตได้')
        }
      })
    }
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <Link
        href={`/templates/${id}`}
        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
        title="จัดการฟิลด์/ดูรายละเอียด"
      >
        <Settings className="w-4 h-4" />
      </Link>
      <Link
        href={`/templates/${id}/edit`}
        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
        title="แก้ไขข้อมูลเทมเพลต"
      >
        <Edit2 className="w-4 h-4" />
      </Link>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
        title="ลบเทมเพลต"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  )
}
