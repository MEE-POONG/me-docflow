import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, FileText, User, CheckCircle2, XCircle, Clock, FileCheck } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { PreviewActions, PrintHelper, PrintActions } from './PrintHelper'
import { DocumentPreview } from '@/components/templates/builder/DocumentPreview'
import { PurchaseOrderPrintLayout } from '@/components/templates/PurchaseOrderPrintLayout'
import { InvoicePrintLayout } from '@/components/templates/InvoicePrintLayout'
import { WithholdingTaxPrintLayout } from '@/components/templates/WithholdingTaxPrintLayout'
import { mapDocumentToTemplateData } from '@/lib/template-data-mapping'

const prisma = new PrismaClient()

export default async function DocumentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ print?: string, preview?: string, templateId?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const documentId = resolvedParams.id;
  const isPrint = resolvedSearchParams.print === 'true';
  const isPreview = resolvedSearchParams.preview === 'true';
  const selectedTemplateId = resolvedSearchParams.templateId;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      createdBy: true,
      category: true,
      documentType: true,
      template: true,
      company: true,
    }
  })

  if (!document) {
    notFound()
  }

  const templates = await prisma.documentTemplate.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const activeTemplate = selectedTemplateId
    ? templates.find(t => t.id === selectedTemplateId)
    : document.template;

  const layoutData = activeTemplate?.layoutJson as { pages?: unknown[], elements?: unknown[] } | null | undefined
  const hasLayout = Boolean(layoutData && ((layoutData.pages?.length ?? 0) > 0 || (layoutData.elements?.length ?? 0) > 0))

  const isPO = document.documentType?.name?.includes('สั่งซื้อ') || document.documentType?.name?.toUpperCase().includes('PO') || document.documentType?.name?.toLowerCase().includes('purchase order')
  const isInvoice = document.documentType?.name?.includes('ใบแจ้งหนี้') || document.documentType?.name?.includes('ใบวางบิล') || document.documentType?.name?.toLowerCase().includes('invoice') || document.documentType?.name?.toLowerCase().includes('billing note')

  if (isPrint || isPreview) {
    if (isPO && (!activeTemplate || !hasLayout)) {
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
          {isPrint ? <PrintHelper /> : <PreviewActions />}
          <div className="print-section mx-auto py-6 print:py-0 flex justify-center">
            <PurchaseOrderPrintLayout data={mapDocumentToTemplateData(document, document.company, document.createdBy)} />
          </div>
        </div>
      )
    }

    if (isInvoice && (!activeTemplate || !hasLayout)) {
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
          {isPrint ? <PrintHelper /> : <PreviewActions />}
          <div className="print-section mx-auto py-6 print:py-0 flex justify-center">
            <InvoicePrintLayout data={mapDocumentToTemplateData(document, document.company, document.createdBy)} />
          </div>
        </div>
      )
    }

    const isWithholdingTax = document.documentType?.name?.includes('หัก ณ ที่จ่าย') || document.documentType?.name?.includes('50 ทวิ')
    if (isWithholdingTax && (!activeTemplate || !hasLayout)) {
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
          {isPrint ? <PrintHelper /> : <PreviewActions />}
          <div className="print-section mx-auto py-6 print:py-0 flex justify-center">
            <WithholdingTaxPrintLayout data={mapDocumentToTemplateData(document, document.company, document.createdBy)} />
          </div>
        </div>
      )
    }

    if (hasLayout && activeTemplate) {
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
          {isPrint ? <PrintHelper /> : <PreviewActions />}
          <div className="print-section mx-auto py-6 print:py-0">
            <DocumentPreview
              layoutJsonString={JSON.stringify(activeTemplate.layoutJson)}
              dataOverride={mapDocumentToTemplateData(document, document.company, document.createdBy)}
            />
          </div>
        </div>
      )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้ว</span>
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"><XCircle className="w-3.5 h-3.5" /> ไม่อนุมัติ</span>
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3.5 h-3.5" /> รออนุมัติ</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">ฉบับร่าง</span>
    }
  }

  return (
    <div className={`mx-auto max-w-6xl px-4 pb-14 pt-4 md:px-5 md:pt-5 ${isPrint ? 'print-section' : ''}`}>
      {isPrint && <PrintHelper />}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 no-print">
        <Link href="/documents" className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white">
          <ArrowLeft className="w-4 h-4" /> กลับหน้ารายการ
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/documents/${document.id}/edit`} className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50">
            แก้ไขเอกสาร
          </Link>
          <PrintActions templates={templates} currentTemplateId={selectedTemplateId || document.templateId} documentId={document.id} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 md:px-6">
          <div>
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5 no-print">
              <span className="rounded border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {document.documentNo}
              </span>
              {getStatusBadge(document.status)}
              <span className="rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                หมวดหมู่: {document.category?.name || '-'}
              </span>
            </div>

            <h1 className="mb-3 text-xl font-bold tracking-tight text-gray-950 dark:text-white">
              {document.title}
            </h1>

            <div className="grid gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 text-sm dark:border-gray-700 dark:bg-gray-700 md:grid-cols-3">
              <div className="flex items-start gap-2.5 bg-gray-50 px-3.5 py-2.5 dark:bg-gray-800/70">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div><p className="text-xs text-gray-500 dark:text-gray-400">ประเภท / เทมเพลต</p><p className="mt-0.5 font-medium text-gray-800 dark:text-gray-100">{activeTemplate?.name || document.documentType?.name || '-'}</p></div>
              </div>
              <div className="flex items-start gap-2.5 bg-gray-50 px-3.5 py-2.5 dark:bg-gray-800/70">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div><p className="text-xs text-gray-500 dark:text-gray-400">ผู้จัดทำเอกสาร</p><p className="mt-0.5 font-medium text-gray-800 dark:text-gray-100">{document.createdBy?.name || '-'}</p></div>
              </div>
              <div className="flex items-start gap-2.5 bg-gray-50 px-3.5 py-2.5 dark:bg-gray-800/70">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div><p className="text-xs text-gray-500 dark:text-gray-400">วันที่จัดทำ</p><p className="mt-0.5 font-medium text-gray-800 dark:text-gray-100">{format(new Date(document.createdAt), 'dd MMMM yyyy HH:mm', { locale: th })}</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 dark:bg-gray-900 md:px-6 md:py-5">
          <div className="min-h-[360px]">
            <div className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-800">
              <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                <FileCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                รายละเอียดเอกสาร
              </h3>

              {document.note ? (
                <div className="border-l-2 border-gray-300 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-800/60">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{document.note}</p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">ไม่มีหมายเหตุเพิ่มเติม</p>
              )}
            </div>

            {/* Document Content */}
            {document.dataJson ? (
              <div className="overflow-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                {(() => {
                  try {
                    const data = typeof document.dataJson === 'string' ? JSON.parse(document.dataJson) : document.dataJson;

                    // If it's empty
                    if (Object.keys(data).length === 0) {
                      return <div className="p-10 text-center text-gray-400 font-medium italic">ไม่มีข้อมูลที่กรอกในเอกสารนี้</div>
                    }

                    return (
                      <div className="p-5 md:p-6 space-y-8">
                        {/* Key-Value Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {Object.entries(data)
                            .filter(([key, value]) => !Array.isArray(value) && typeof value !== 'object')
                            .map(([key, value]) => (
                              <div key={key} className="border-b border-gray-100 dark:border-gray-800 pb-3">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{key}</div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                                  {value === null || value === '' ? '-' : typeof value === 'boolean' ? (value ? 'ใช่ (Yes)' : 'ไม่ใช่ (No)') : String(value)}
                                </div>
                              </div>
                          ))}
                        </div>

                        {/* Array Fields (Tables) */}
                        {Object.entries(data)
                          .filter(([key, value]) => Array.isArray(value) && value.length > 0 && typeof value[0] === 'object')
                          .map(([key, value]) => (
                            <div key={key} className="overflow-x-auto mt-6">
                              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase">{key}</h4>
                              <table className="w-full text-left text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                  <tr>
                                    {Object.keys((value as any[])[0]).map(col => (
                                      <th key={col} className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 capitalize">{col}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                  {(value as any[]).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                                      {Object.values(row).map((val: any, colIdx) => (
                                        <td key={colIdx} className="px-4 py-2 text-gray-800 dark:text-gray-200">
                                          {val === null || val === '' ? '-' : typeof val === 'boolean' ? (val ? 'ใช่' : 'ไม่ใช่') : String(val)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                      </div>
                    )
                  } catch {
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
