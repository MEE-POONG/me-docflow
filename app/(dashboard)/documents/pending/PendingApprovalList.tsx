'use client'

import { useState, useEffect, useTransition } from 'react'
import { CheckCircle2, XCircle, Eye, Search, Filter, Loader2, AlertCircle, Printer, X } from 'lucide-react'
import { approveDocument, rejectDocument } from '@/app/actions/approval'
import { format } from 'date-fns'
import { th, enUS } from 'date-fns/locale'
import Link from 'next/link'
import { DocumentPreview } from '@/components/templates/builder/DocumentPreview'
import { mapDocumentToTemplateData } from '@/lib/template-data-mapping'
import { useLanguage } from '@/lib/i18n/LanguageContext'

type Document = {
  id: string
  documentNo: string
  title: string
  status: string
  createdAt: Date
  rejectedReason?: string | null
  dataJson?: unknown
  templateId?: string | null
  company?: {
    name?: string | null
    taxId?: string | null
    address?: string | null
    phone?: string | null
  } | null
  createdBy: {
    name: string
    email?: string
    role?: string | null
  }
}

type Template = {
  id: string
  name: string
  layoutJson?: unknown
}

type Props = {
  documents: Document[]
  templates: Template[]
}

const REJECTION_REASON_GROUPS = [
  {
    title: 'ด้านความถูกต้องและครบถ้วนของเอกสาร',
    reasons: [
      'เอกสารแนบไม่ครบถ้วน: ขาดหลักฐานประกอบการพิจารณาตามที่ระบุในระเบียบ',
      'ข้อมูลไม่สมบูรณ์: กรอกข้อมูลในแบบฟอร์มไม่ครบถ้วน หรือเว้นว่างในช่องข้อมูลสำคัญ',
      'ลงนามไม่ครบถ้วน: ขาดลายมือชื่อของผู้ยื่นคำขอ ผู้บังคับบัญชา หรือผู้มีอำนาจลงนามอนุมัติตามลำดับขั้น',
      'เอกสารหมดอายุ: หลักฐานประกอบที่นำมาแนบ (เช่น บัตรประชาชน หนังสือรับรอง) สิ้นสุดระยะเวลาหรือการใช้งานแล้ว',
    ],
  },
  {
    title: 'ด้านความถูกต้องของข้อมูลและหลักเกณฑ์',
    reasons: [
      'ข้อมูลขัดแย้งกัน: รายละเอียดในเอกสารไม่ตรงกับระบบฐานข้อมูล หรือขัดแย้งกับหลักฐานแนบอื่น',
      'ไม่เป็นไปตามหลักเกณฑ์องค์กร: วัตถุประสงค์หรือรายละเอียดของคำขอขัดต่อข้อบังคับ นโยบาย หรือระเบียบการเบิกจ่ายของหน่วยงาน',
      'เกินวงเงินหรือสิทธิ์ที่กำหนด: คำขอเกินกว่าสิทธิ์ สิทธิประโยชน์ หรือวงเงินงบประมาณที่ผู้ยื่นมีสิทธิ์ได้รับ',
      'ยื่นเรื่องเกินกำหนดเวลา: การส่งเอกสารล่าช้ากว่าระยะเวลาที่ระบบหรือระเบียบข้อบังคับกำหนดไว้ (Overdue)',
    ],
  },
  {
    title: 'ด้านความซ้ำซ้อนและวัตถุประสงค์',
    reasons: [
      'คำขอซ้ำซ้อน: มีการยื่นเรื่องในวัตถุประสงค์เดียวกันและอยู่ในระหว่างการดำเนินการ หรืออนุมัติไปก่อนหน้านี้แล้ว',
      'ข้อมูลไม่มีน้ำหนักเหตุผลเพียงพอ: เหตุผลความจำเป็นที่ระบุในเอกสารขาดหลักฐานหรือคำอธิบายที่เพียงพอต่อการอนุมัติ',
    ],
  },
] as const

function hasLayoutElements(layoutJson: unknown) {
  const layout = layoutJson as { pages?: unknown[]; elements?: unknown[] } | null | undefined
  return Boolean(layout && ((layout.pages?.length ?? 0) > 0 || (layout.elements?.length ?? 0) > 0))
}

export default function PendingApprovalList({ documents, templates }: Props) {
  const { t, language } = useLanguage()
  const dateLocale = language === 'en' ? enUS : th
  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedRejectReasons, setSelectedRejectReasons] = useState<string[]>([])
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [printPreviewDoc, setPrintPreviewDoc] = useState<Document | null>(null)
  const [printTemplateId, setPrintTemplateId] = useState('')

  const [myDocuments, setMyDocuments] = useState<Document[]>(documents)

  useEffect(() => {
    setMyDocuments(documents)
  }, [documents])

  const filteredDocs = myDocuments.filter(doc =>
    doc.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> {t.documentsList.statusApproved}</span>
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"><XCircle className="w-3.5 h-3.5" /> {t.pendingApproval.statusCancelledRejected}</span>
      case 'PENDING':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t.documentsList.statusPending}</span>
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{t.documentsList.statusDraft}</span>
    }
  }

  const handleApprove = (id: string) => {
    if (!confirm(t.pendingApproval.confirmApprove)) return

    setProcessingId(id)
    startTransition(async () => {
      await approveDocument(id)
      setProcessingId(null)
    })
  }

  const openPrintPreview = (doc: Document) => {
    setPrintPreviewDoc(doc)
    setPrintTemplateId(doc.templateId || '')
  }

  const handleConfirmPrint = () => {
    if (!printPreviewDoc) return
    const url = new URL(`/documents/${printPreviewDoc.id}`, window.location.origin)
    if (printTemplateId) url.searchParams.set('templateId', printTemplateId)
    url.searchParams.set('print', 'true')
    window.open(url.toString(), '_blank')
    setPrintPreviewDoc(null)
  }

  const handleReject = (id: string) => {
    if (selectedRejectReasons.length === 0) {
      alert(t.pendingApproval.rejectReasonRequired)
      return
    }

    const completeReason = [
      ...selectedRejectReasons.map(reason => `• ${reason}`),
      rejectReason.trim() ? `หมายเหตุเพิ่มเติม: ${rejectReason.trim()}` : '',
    ].filter(Boolean).join('\n')

    setProcessingId(id)
    startTransition(async () => {
      await rejectDocument(id, completeReason)
      setProcessingId(null)
      setShowRejectModal(null)
      setRejectReason('')
      setSelectedRejectReasons([])
    })
  }

  const toggleRejectReason = (reason: string) => {
    setSelectedRejectReasons(current =>
      current.includes(reason)
        ? current.filter(item => item !== reason)
        : [...current, reason]
    )
  }

  return (
    <>
      <div className="mb-8">
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 tracking-wider mb-1 uppercase">
          {t.common.companyWorkspace}
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{t.pendingApproval.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.pendingApproval.subtitle}
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            {t.pendingApproval.listTitle} ({myDocuments.length})
          </h2>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t.pendingApproval.searchPlaceholder}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
              />
            </div>
            <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30">
              <tr>
                <th className="px-6 py-4 font-normal">{t.documentsList.colDocNo}</th>
                <th className="px-6 py-4 font-normal">{t.documentsList.colTitle}</th>
                <th className="px-6 py-4 font-normal">{t.common.status}</th>
                <th className="px-6 py-4 font-normal">{t.documentsList.colCreatedBy}</th>
                <th className="px-6 py-4 font-normal">{t.documentsList.colCreatedAt}</th>
                <th className="px-6 py-4 font-normal text-right">{t.common.manage}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-base font-medium">{t.pendingApproval.emptyTitle}</p>
                    <p className="text-sm mt-1">{t.pendingApproval.emptyHint}</p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400">
                      <Link href={`/documents/${doc.id}`} className="hover:underline">{doc.documentNo}</Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white font-medium">
                        <Link href={`/documents/${doc.id}`} className="hover:underline">{doc.title}</Link>
                      </div>
                      {doc.status === 'REJECTED' && doc.rejectedReason && (
                        <div className="text-xs text-rose-500 dark:text-rose-400 mt-1 flex items-start gap-1">
                          <span className="font-semibold">{t.pendingApproval.rejectedReasonLabel}</span> {doc.rejectedReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                        {doc.createdBy.name.charAt(0)}
                      </div>
                      {doc.createdBy.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {format(new Date(doc.createdAt), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/documents/${doc.id}`} className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t.documentsList.viewDetails}>
                        <Eye className="w-5 h-5" />
                      </Link>
                      {doc.status === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => openPrintPreview(doc)}
                          className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title={t.pendingApproval.printReport}
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                      )}
                      {doc.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(doc.id)}
                            disabled={isPending && processingId === doc.id}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title={t.pendingApproval.approve}
                          >
                            {isPending && processingId === doc.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => setShowRejectModal(doc.id)}
                            disabled={isPending && processingId === doc.id}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title={t.pendingApproval.rejectCancel}
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
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
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="shrink-0 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-[17px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  ระบุเหตุผลการไม่อนุมัติ
                </h3>
                <div className="mt-1 flex items-center gap-2 text-[13px] text-gray-500 dark:text-gray-400">
                  <span>เลือกได้มากกว่า 1 เหตุผล</span>
                  {selectedRejectReasons.length > 0 && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                      เลือกแล้ว {selectedRejectReasons.length} ข้อ
                    </span>
                  )}
                </div>
              </div>
              <div className="min-h-0 overflow-y-auto px-5 py-4 space-y-5">
                {REJECTION_REASON_GROUPS.map((group, groupIndex) => (
                  <fieldset key={group.title}>
                    <legend className="mb-2.5 text-[13px] font-bold text-gray-900 dark:text-white">
                      {groupIndex + 1}. {group.title}
                    </legend>
                    <div className="space-y-2">
                      {group.reasons.map(reason => (
                        <label
                          key={reason}
                          className={`group flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-all ${selectedRejectReasons.includes(reason)
                              ? 'border-rose-300 bg-rose-50 shadow-sm dark:border-rose-700 dark:bg-rose-950/30'
                              : 'border-gray-200 hover:border-rose-200 hover:bg-rose-50/40 dark:border-gray-700 dark:hover:border-rose-800 dark:hover:bg-rose-950/20'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRejectReasons.includes(reason)}
                            onChange={() => toggleRejectReason(reason)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-rose-600 focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-800"
                          />
                          <span className="text-[13px] leading-5 text-gray-600 dark:text-gray-300">
                            <strong className="font-semibold text-gray-800 dark:text-gray-100">
                              {reason.split(':')[0]}:
                            </strong>{' '}
                            {reason.split(':').slice(1).join(':').trim()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}

                <div>
                  <label htmlFor="reject-note" className="mb-2 block text-[13px] font-bold text-gray-900 dark:text-white">
                    หมายเหตุเพิ่มเติม <span className="font-normal text-gray-400">(ถ้ามี)</span>
                  </label>
                  <textarea
                    id="reject-note"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="ระบุรายละเอียดเพิ่มเติมเกี่ยวกับการไม่อนุมัติ..."
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[82px] bg-gray-50 dark:bg-gray-800 text-[13px] text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none resize-y"
                  ></textarea>
                </div>
              </div>
              <div className="shrink-0 px-5 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => {
                    setShowRejectModal(null)
                    setRejectReason('')
                    setSelectedRejectReasons([])
                  }}
                  className="px-4 py-2 text-[13px] text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={isPending || selectedRejectReasons.length === 0}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-[13px] text-white font-medium rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending && processingId === showRejectModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  ยืนยันไม่อนุมัติ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print Preview Modal */}
        {printPreviewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Printer className="w-4.5 h-4.5 text-emerald-500" />
                  เลือกเทมเพลตก่อนพิมพ์ — {printPreviewDoc.documentNo}
                </h3>
                <button
                  onClick={() => setPrintPreviewDoc(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">เทมเพลตเอกสาร</label>
                <select
                  value={printTemplateId}
                  onChange={e => setPrintTemplateId(e.target.value)}
                  className="w-full sm:w-80 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- รูปแบบมาตรฐาน --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-5 overflow-auto flex-1 bg-gray-50 dark:bg-gray-900/40">
                {(() => {
                  const selectedTemplate = templates.find(t => t.id === printTemplateId)
                  if (!selectedTemplate || !hasLayoutElements(selectedTemplate.layoutJson)) {
                    return (
                      <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        ไม่มีตัวอย่างสำหรับรูปแบบมาตรฐาน — เอกสารจะพิมพ์ด้วยรูปแบบทั่วไป
                      </div>
                    )
                  }
                  return (
                    <DocumentPreview
                      layoutJsonString={JSON.stringify(selectedTemplate.layoutJson)}
                      dataOverride={mapDocumentToTemplateData(printPreviewDoc, printPreviewDoc.company, printPreviewDoc.createdBy)}
                      scale={0.6}
                    />
                  )
                })()}
              </div>

              <div className="p-5 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setPrintPreviewDoc(null)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmPrint}
                  className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  ยืนยันพิมพ์
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
