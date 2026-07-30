import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, FileText, User, CheckCircle2, XCircle, Clock, FileCheck } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

const prisma = new PrismaClient()

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const documentId = resolvedParams.id;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      createdBy: true,
      category: true,
      documentType: true,
      template: true,
    }
  })

  if (!document) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-4 h-4" /> อนุมัติแล้ว</span>
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"><XCircle className="w-4 h-4" /> ไม่อนุมัติ</span>
      case 'PENDING':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-4 h-4" /> รออนุมัติ</span>
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">ฉบับร่าง</span>
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-20 p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/documents" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-gray-900 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <ArrowLeft className="w-4 h-4" /> กลับหน้ารายการ
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-lg text-sm font-bold tracking-wider border border-indigo-200 dark:border-indigo-800">
                {document.documentNo}
              </span>
              {getStatusBadge(document.status)}
              <span className="px-3 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-lg text-sm font-medium">
                หมวดหมู่: {document.category?.name || '-'}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
              {document.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                  <FileText className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="font-medium">ประเภท:</span> {document.documentType?.name || '-'}
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                  <User className="w-4 h-4 text-blue-500" />
                </div>
                <span className="font-medium">ผู้สร้าง:</span> {document.createdBy?.name || '-'}
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="font-medium">สร้างเมื่อ:</span> {format(new Date(document.createdAt), 'dd MMMM yyyy HH:mm', { locale: th })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-800/30">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 min-h-[500px] shadow-sm">
            <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <FileCheck className="w-5 h-5 text-indigo-500" />
                รายละเอียดเอกสาร
              </h3>

              {document.note ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{document.note}</p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">ไม่มีหมายเหตุเพิ่มเติม</p>
              )}
            </div>

            {/* Document Content */}
            {document.dataJson ? (
              <div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                {(() => {
                  try {
                    const data = typeof document.dataJson === 'string' ? JSON.parse(document.dataJson) : document.dataJson;

                    // If it's empty
                    if (Object.keys(data).length === 0) {
                      return <div className="p-10 text-center text-gray-400 font-medium italic">ไม่มีข้อมูลที่กรอกในเอกสารนี้</div>
                    }

                    return (
                      <div>
                        {/* Header Info */}
                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-200 dark:border-gray-700">
                          <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">ข้อมูลลูกค้า / ผู้ติดต่อ</h4>
                            <div className="space-y-2">
                              <p className="font-bold text-lg text-[#38A1C5]">{data.partnerName || '-'}</p>
                              <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm">{data.address || '-'}</p>
                              {data.taxId && <p className="text-gray-600 dark:text-gray-400 mt-2"><span className="font-medium text-gray-500">เลขประจำตัวผู้เสียภาษี:</span> {data.taxId}</p>}
                              {data.branch && <p className="text-gray-600 dark:text-gray-400"><span className="font-medium text-gray-500">สาขา:</span> {data.branch}</p>}
                            </div>
                          </div>
                          <div className="md:text-right">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">ข้อมูลเอกสารอ้างอิง</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between md:justify-end gap-8">
                                <span className="text-gray-500 font-medium">วันที่:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{data.date || '-'}</span>
                              </div>
                              <div className="flex justify-between md:justify-end gap-8">
                                <span className="text-gray-500 font-medium">ครบกำหนด:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{data.dueDate || '-'}</span>
                              </div>
                              <div className="flex justify-between md:justify-end gap-8">
                                <span className="text-gray-500 font-medium">โปรเจ็ค:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{data.project || '-'}</span>
                              </div>
                              <div className="flex justify-between md:justify-end gap-8">
                                <span className="text-gray-500 font-medium">อ้างอิง:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{data.referenceNo || '-'}</span>
                              </div>
                              <div className="flex justify-between md:justify-end gap-8">
                                <span className="text-gray-500 font-medium">ผู้สั่งซื้อ:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{data.orderedBy || '-'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Line Items */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-[#38A1C5]/10 dark:bg-[#38A1C5]/20 text-[#2C809E] dark:text-[#5ABBD8] border-b border-[#38A1C5]/20">
                              <tr>
                                <th className="px-6 py-4 font-bold w-16 text-center">ลำดับ</th>
                                <th className="px-6 py-4 font-bold">ชื่อสินค้า / รายละเอียด</th>
                                <th className="px-6 py-4 font-bold text-right w-32">จำนวน</th>
                                <th className="px-6 py-4 font-bold text-right w-40">ราคาต่อหน่วย</th>
                                <th className="px-6 py-4 font-bold text-right w-40">ราคารวม</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {(data.items || []).map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                  <td className="px-6 py-4 text-center text-gray-500">{idx + 1}</td>
                                  <td className="px-6 py-4 text-gray-900 dark:text-gray-300 font-medium">{item.name || '-'}</td>
                                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{item.qty} {item.unit}</td>
                                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{Number(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                    {(Number(item.qty || 0) * Number(item.unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Totals */}
                        <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-800/30 flex flex-col md:flex-row justify-between items-start border-t border-gray-200 dark:border-gray-700">
                          <div className="w-full md:w-1/2 mb-6 md:mb-0 space-y-4">
                            {data.remarks && (
                              <div>
                                <h4 className="text-sm font-bold text-gray-500 mb-1">หมายเหตุ:</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.remarks}</p>
                              </div>
                            )}
                            {data.hasSignature && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 w-48">
                                <div className="text-center">
                                  <div className="h-16 border-b border-gray-300 dark:border-gray-600 mb-2"></div>
                                  <p className="text-xs text-gray-500">ลายเซ็นผู้มีอำนาจลงนาม</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="w-full md:w-80 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 font-medium">รวมเป็นเงิน</span>
                              <span className="font-medium text-gray-900 dark:text-white">{(data.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {data.discountAmount > 0 && (
                              <div className="flex justify-between items-center text-sm text-red-500">
                                <span className="font-medium">ส่วนลด ({data.discountPercent}%)</span>
                                <span className="font-medium">- {(data.discountAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 font-medium">ราคาหลังหักส่วนลด</span>
                              <span className="font-medium text-gray-900 dark:text-white">{(data.afterDiscount || data.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {data.hasVat && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">ภาษีมูลค่าเพิ่ม 7%</span>
                                <span className="font-medium text-gray-900 dark:text-white">{(data.vatAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-lg pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
                              <span className="font-bold text-[#38A1C5]">จำนวนเงินรวมทั้งสิ้น</span>
                              <span className="font-bold text-[#38A1C5]">{(data.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  } catch (e) {
                    return <div className="p-8 text-center text-gray-500 font-medium">ข้อมูลเอกสารไม่ถูกต้อง (Invalid JSON format)</div>
                  }
                })()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 mt-8">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h4 className="text-gray-500 dark:text-gray-400 font-medium text-lg">ไม่มีข้อมูลรายละเอียดเอกสาร</h4>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
