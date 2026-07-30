'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, Eye, Search, Filter, Loader2, AlertCircle } from 'lucide-react'
import { approveDocument, rejectDocument } from '@/app/actions/approval'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import Link from 'next/link'

type Document = {
  id: string
  documentNo: string
  title: string
  status: string
  createdAt: Date
  createdBy: {
    name: string
  }
}

type Props = {
  documents: Document[]
}

export default function PendingApprovalList({ documents }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)

  const filteredDocs = documents.filter(doc => 
    doc.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleApprove = (id: string) => {
    if (!confirm('ยืนยันการอนุมัติเอกสารนี้?')) return
    
    setProcessingId(id)
    startTransition(async () => {
      await approveDocument(id)
      setProcessingId(null)
    })
  }

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลการไม่อนุมัติ')
      return
    }
    
    setProcessingId(id)
    startTransition(async () => {
      await rejectDocument(id, rejectReason)
      setProcessingId(null)
      setShowRejectModal(null)
      setRejectReason('')
    })
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
          รายการรออนุมัติ ({documents.length})
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาเอกสาร..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-900 dark:text-gray-100 w-full sm:w-64"
            />
          </div>
          <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4 font-semibold">เลขที่เอกสาร</th>
              <th className="px-6 py-4 font-semibold">ชื่อเอกสาร</th>
              <th className="px-6 py-4 font-semibold">ผู้สร้าง</th>
              <th className="px-6 py-4 font-semibold">วันที่สร้าง</th>
              <th className="px-6 py-4 font-semibold text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-base font-medium">ไม่พบเอกสารที่รออนุมัติ</p>
                  <p className="text-sm mt-1">ยังไม่มีรายการเอกสารที่ต้องดำเนินการในขณะนี้</p>
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400">
                    <Link href={`/documents/${doc.id}`} className="hover:underline">{doc.documentNo}</Link>
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-medium">
                    <Link href={`/documents/${doc.id}`} className="hover:underline">{doc.title}</Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                      {doc.createdBy.name.charAt(0)}
                    </div>
                    {doc.createdBy.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {format(new Date(doc.createdAt), 'dd MMM yyyy HH:mm', { locale: th })}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/documents/${doc.id}`} className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="ดูรายละเอียด">
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button 
                      onClick={() => handleApprove(doc.id)}
                      disabled={isPending && processingId === doc.id}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors disabled:opacity-50" 
                      title="อนุมัติ"
                    >
                      {isPending && processingId === doc.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => setShowRejectModal(doc.id)}
                      disabled={isPending && processingId === doc.id}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors disabled:opacity-50" 
                      title="ไม่อนุมัติ"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                ระบุเหตุผลการไม่อนุมัติ
              </h3>
            </div>
            <div className="p-6">
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="กรุณาระบุเหตุผลที่ไม่อนุมัติเอกสารนี้ เพื่อให้ผู้สร้างแก้ไข..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl min-h-[120px] bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"
              ></textarea>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectReason('')
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => handleReject(showRejectModal)}
                disabled={isPending || !rejectReason.trim()}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && processingId === showRejectModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                ยืนยันไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
