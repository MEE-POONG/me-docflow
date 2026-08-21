'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Link as LinkIcon, ArrowLeft, ArrowRight, Search, Plus, Trash2, Printer, Download, MoreHorizontal, Share2, FileText, CheckCircle2, Send } from 'lucide-react'
import { createDocument, updateDocument, submitDocument } from '@/app/actions/documents'
import { DocumentPreview } from '@/components/templates/builder/DocumentPreview'
import { PurchaseOrderPrintLayout } from '@/components/templates/PurchaseOrderPrintLayout'
import { InvoicePrintLayout } from '@/components/templates/InvoicePrintLayout'
import { WithholdingTaxPrintLayout } from '@/components/templates/WithholdingTaxPrintLayout'
import { mapDocumentToTemplateData } from '@/lib/template-data-mapping'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import Link from 'next/link'

type CreateDocumentFormProps = {
  folders: any[]
  tags: any[]
  categories: any[]
  documentTypes: any[]
  templates: any[]
  company?: any
  initialData?: any
}

function hasLayoutElements(layoutJson: unknown) {
  const layout = layoutJson as { pages?: unknown[]; elements?: unknown[] } | null | undefined
  return Boolean(layout && ((layout.pages?.length ?? 0) > 0 || (layout.elements?.length ?? 0) > 0))
}

function getCurrentUser(): { name?: string; email?: string } {
  if (typeof window === 'undefined') return {}
  const userStr = localStorage.getItem('me_docflow_current_user')
  if (!userStr) return {}
  try {
    return JSON.parse(userStr)
  } catch {
    return {}
  }
}

export default function CreateDocumentForm({ folders, tags, categories, documentTypes, templates, company, initialData }: CreateDocumentFormProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<1 | 2 | 3>(initialData ? 2 : 1)
  const [savedDocument, setSavedDocument] = useState<any>(initialData || null)
  const initialCategoryId = initialData?.categoryId || categories[0]?.id || ''
  const initialDocumentTypeId = initialData?.documentTypeId
    || documentTypes.find(type => type.categoryId === initialCategoryId)?.id
    || ''
  
  const defaultTitle = documentTypes.find(type => type.id === initialDocumentTypeId)?.name || 'เอกสารใหม่'

  // Base Document Info (Title, Category, etc.)
  const [docInfo, setDocInfo] = useState({
    title: initialData?.title || defaultTitle,
    categoryId: initialCategoryId,
    documentTypeId: initialDocumentTypeId,
    templateId: initialData?.templateId || '',
  })

  // Parse initial dataJson if available
  const parsedData = initialData?.dataJson ? (typeof initialData.dataJson === 'string' ? JSON.parse(initialData.dataJson) : initialData.dataJson) : {}
  const initialItems = parsedData.items?.length > 0 ? parsedData.items : [{ id: 1, name: '', qty: 1, unit: 'ชิ้น', unitPrice: 0 }]

  const [customData, setCustomData] = useState<Record<string, any>>(parsedData || {})

  // Structured Form Data
  const [formData, setFormData] = useState({
    partnerType: parsedData.partnerType || 'company', // company, individual
    partnerRole: parsedData.partnerRole || 'customer', // customer, vendor
    partnerName: parsedData.partnerName || '',
    address: parsedData.address || '',
    taxId: parsedData.taxId || '',
    branch: parsedData.branch || '',
    
    date: parsedData.date || new Date().toISOString().split('T')[0],
    creditDays: parsedData.creditDays || 0,
    dueDate: parsedData.dueDate || new Date().toISOString().split('T')[0],
    orderedBy: parsedData.orderedBy || '',
    currency: parsedData.currency || 'THB',
    
    project: parsedData.project || '',
    referenceNo: parsedData.referenceNo || '',
    warehouse: parsedData.warehouse || '',
    priceType: parsedData.priceType || 'exclude_vat',
    
    items: initialItems,
    
    remarks: parsedData.remarks || '',
    internalNotes: parsedData.internalNotes || '',
    hasSignature: parsedData.hasSignature ?? true,
    hasVat: parsedData.hasVat ?? true,
    hasWht: parsedData.hasWht || false,
    
    discountPercent: parsedData.discountPercent || 0,
    
    // Bank info
    bankName: parsedData.bankName || '',
    accountName: parsedData.accountName || '',
    accountNo: parsedData.accountNo || '',
    branchName: parsedData.branchName || '',
    accountType: parsedData.accountType || 'saving',
  })

  // Calculations
  const subtotal = formData.items.reduce((sum: number, item: any) => sum + (Number(item.qty) * Number(item.unitPrice)), 0)
  const discountAmount = subtotal * (Number(formData.discountPercent) / 100)
  const afterDiscount = subtotal - discountAmount
  const vatAmount = formData.hasVat ? (formData.priceType === 'exclude_vat' ? afterDiscount * 0.07 : afterDiscount - (afterDiscount / 1.07)) : 0
  const grandTotal = formData.priceType === 'exclude_vat' ? afterDiscount + vatAmount : afterDiscount

  const selectedTemplate = templates.find(t => t.id === docInfo.templateId)
  const matchingTemplates = templates.filter(t => t.documentTypeId === docInfo.documentTypeId)
  const otherTemplates = templates.filter(t => t.documentTypeId !== docInfo.documentTypeId)
  const formType = selectedTemplate?.formType || 'STANDARD'
  const rawFormSchema = selectedTemplate?.formSchema
    ? (typeof selectedTemplate.formSchema === 'string' ? JSON.parse(selectedTemplate.formSchema) : selectedTemplate.formSchema)
    : (selectedTemplate?.fields || [])
  const formSchema = Array.isArray(rawFormSchema)
    ? rawFormSchema.map(field => ({ ...field, type: String(field.type || 'text').toLowerCase() }))
    : []

  const handleTemplateChange = (templateId: string) => {
    if (!templateId) {
      setDocInfo({ ...docInfo, templateId: '' })
      return
    }

    const template = templates.find(t => t.id === templateId)
    if (!template) return

    // A template owns its category/type relationship. Keep the document aligned
    // when a user chooses a template from another document form.
    setDocInfo({
      ...docInfo,
      categoryId: template.categoryId,
      documentTypeId: template.documentTypeId,
      templateId: template.id,
    })
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id: Date.now(), name: '', qty: 1, unit: 'ชิ้น', unitPrice: 0 }]
    })
  }

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    const newItems = formData.items.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // The standard document form is always the primary data source. Template
    // fields extend it instead of replacing the user's original form.
    const dataJson = JSON.stringify({
      ...customData,
      ...formData,
      subtotal,
      discountAmount,
      afterDiscount,
      vatAmount,
      grandTotal,
    })

    startTransition(async () => {
      let result

      const currentUserEmail = getCurrentUser().email

      const payload = {
        title: formData.partnerName ? `${docInfo.title} - ${formData.partnerName}` : docInfo.title,
        categoryId: docInfo.categoryId,
        documentTypeId: docInfo.documentTypeId,
        templateId: docInfo.templateId || undefined,
        dataJson,
        subtotalSatang: Math.round(subtotal * 100),
        vatSatang: Math.round(vatAmount * 100),
        totalSatang: Math.round(grandTotal * 100),
        userEmail: currentUserEmail
      }

      const savedId = savedDocument?.id || initialData?.id
      if (savedId) {
        result = await updateDocument(savedId, payload)
      } else {
        result = await createDocument(payload)
      }

      if (result.success) {
        setSavedDocument(result.document)
        setStep(3)
        router.refresh()
      } else {
        alert(t.createDocument.saveErrorPrefix + result.error)
      }
    })
  }

  const handleSubmitForApproval = () => {
    const savedId = savedDocument?.id || initialData?.id;
    if (!savedId) return;

    if (confirm(`คุณต้องการยื่นขออนุมัติเอกสารนี้ใช่หรือไม่?`)) {
      startTransition(async () => {
        const result = await submitDocument(savedId)
        if (result.success) {
          router.push('/documents')
          router.refresh()
        } else {
          alert('เกิดข้อผิดพลาดในการยื่นขออนุมัติ')
        }
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-document-form max-w-[1400px] mx-auto pb-20 p-2 md:p-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Link href="/documents" className="text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2 mb-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t.createDocument.backToList}
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <FileText className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {initialData ? t.createDocument.editDocument : t.createDocument.createNew}
              <span className="text-emerald-600 dark:text-emerald-400 ml-3">{initialData?.documentNo || savedDocument?.documentNo || 'Auto Generated'}</span>
            </h1>
            <span className="ml-2 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              {t.createDocument.step} {step}/3
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/documents" className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900 shadow-sm text-sm font-medium">
            {t.createDocument.closeWindow}
          </Link>
          {step === 1 && (
            <button
              type="button"
              disabled={!docInfo.categoryId || !docInfo.documentTypeId}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.createDocument.nextFillData} <ArrowRight className="w-5 h-5" />
            </button>
          )}
          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> {t.createDocument.back}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {t.createDocument.saveDocument}
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> {t.createDocument.backToEdit}
              </button>
              <button
                type="button"
                onClick={() => router.push('/documents')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4" /> {t.createDocument.done}
              </button>
              {savedDocument?.status !== 'PENDING' && savedDocument?.status !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  disabled={isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  ยื่นขออนุมัติ
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">

        {step === 1 && (
        <div className="p-8 md:p-12 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t.createDocument.step1Title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.createDocument.step1Subtitle}</p>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">{t.createDocument.category} <span className="text-red-500">*</span></label>
              <select
                value={docInfo.categoryId}
                onChange={e => {
                  const newCat = e.target.value
                  const typesForCat = documentTypes.filter(t => t.categoryId === newCat)
                  setDocInfo({ 
                    ...docInfo, 
                    categoryId: newCat, 
                    documentTypeId: typesForCat[0]?.id || '', 
                    templateId: '',
                    title: typesForCat[0]?.name || docInfo.title
                  })
                }}
                className="w-full text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="" disabled>{t.createDocument.selectCategory}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">{t.createDocument.documentType} <span className="text-red-500">*</span></label>
              <select
                value={docInfo.documentTypeId}
                onChange={e => {
                  const newType = e.target.value
                  const docTypeObj = documentTypes.find(t => t.id === newType)
                  setDocInfo({ 
                    ...docInfo, 
                    documentTypeId: newType, 
                    templateId: '',
                    title: docTypeObj?.name || docInfo.title
                  })
                }}
                disabled={!docInfo.categoryId}
                className="w-full text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
              >
                <option value="" disabled>{t.createDocument.selectDocumentType}</option>
                {documentTypes.filter(t => t.categoryId === docInfo.categoryId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

          </div>
        </div>
        )}

        {step === 2 && (
        <>
        {/* Document Setting Summary */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="px-2.5 py-1 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 font-medium">
              {categories.find(c => c.id === docInfo.categoryId)?.name || '-'}
            </span>
            <span className="px-2.5 py-1 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 font-medium">
              {documentTypes.find(t => t.id === docInfo.documentTypeId)?.name || '-'}
            </span>
            {docInfo.templateId && (
              <span className="px-2.5 py-1 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 font-medium">
                {templates.find(t => t.id === docInfo.templateId)?.name}
              </span>
            )}
          </div>
          <button type="button" onClick={() => setStep(1)} className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
            {t.createDocument.changeCategoryType}
          </button>
        </div>

        {/* Action icons bar */}
        <div className="flex justify-end px-6 pt-4 pb-2 gap-6 text-emerald-600 dark:text-emerald-400">
           <button type="button" className="flex flex-col items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"><Share2 className="w-5 h-5"/> <span className="text-xs">{t.createDocument.share}</span></button>
           <button type="button" onClick={() => {
             const savedId = savedDocument?.id || initialData?.id
             if (savedId) {
               window.open(`/documents/${savedId}?print=true`, '_blank');
             } else {
               alert(t.createDocument.saveBeforePrint);
             }
           }} className="flex flex-col items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"><Printer className="w-5 h-5"/> <span className="text-xs">{t.createDocument.print}</span></button>
           <button type="button" className="flex flex-col items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"><Download className="w-5 h-5"/> <span className="text-xs">{t.createDocument.download}</span></button>
           <button type="button" className="flex flex-col items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-gray-500"><MoreHorizontal className="w-5 h-5"/> <span className="text-xs">{t.createDocument.more}</span></button>
        </div>

        {/* The original document-entry form stays visible for every template. */}
        {(() => {
          const selectedDocType = documentTypes.find(t => t.id === docInfo.documentTypeId)
          const isPayslip = selectedDocType?.name?.includes('สลิป') || selectedDocType?.name?.toLowerCase().includes('payslip') || selectedDocType?.name?.toUpperCase().includes('PAYSL') || formType === 'PAYSLIP'
          const isLeaveRequest = selectedDocType?.name?.includes('ลา') || selectedDocType?.name?.toLowerCase().includes('leave')
          const isBOJ5 = selectedDocType?.name?.includes('บอจ.5') || selectedDocType?.name?.includes('บัญชีรายชื่อผู้ถือหุ้น')
          const isPK0401 = selectedDocType?.name?.includes('พค.0401') || selectedDocType?.name?.includes('ใบสำคัญแสดงการจดทะเบียนบริษัท')
          const isBOJ2 = selectedDocType?.name?.includes('บอจ.2') || selectedDocType?.name?.includes('หนังสือบริคณห์สนธิ')
          const isMSM = selectedDocType?.name?.includes('รายงานการประชุมตั้งบริษัท') || selectedDocType?.name?.includes('Minutes')
          const isIDCardCopy = selectedDocType?.name?.includes('สำเนาบัตรประชาชน')
          const isPND = selectedDocType?.name?.includes('ภ.ง.ด.') || selectedDocType?.name?.includes('ยื่นภาษีเงินได้หัก ณ ที่จ่าย')
          const isPP30 = selectedDocType?.name?.includes('ภ.พ.30') || selectedDocType?.name?.includes('แบบแสดงรายการภาษีมูลค่าเพิ่ม')
          const isTaxInvoice = selectedDocType?.name?.includes('ใบกำกับภาษี') || selectedDocType?.name?.includes('Tax Invoice')
          const is50Tawi = selectedDocType?.name?.includes('50 ทวิ') || selectedDocType?.name?.includes('หนังสือรับรองการหักภาษี')
          const isPP20 = selectedDocType?.name?.includes('ภ.พ.20') || selectedDocType?.name?.includes('ใบทะเบียนภาษีมูลค่าเพิ่ม')
          const isPND50 = selectedDocType?.name?.includes('ภ.ง.ด.50') || selectedDocType?.name?.includes('ภาษีเงินได้นิติบุคคล')
          const isTimesheet = selectedDocType?.name?.includes('ใบบันทึกเวลาทำงาน') || selectedDocType?.name?.toLowerCase().includes('timesheet')
          const isLeave = selectedDocType?.name?.includes('แบบฟอร์มการลางาน') || selectedDocType?.name?.toLowerCase().includes('leave')
          const isSSO = selectedDocType?.name?.includes('ยื่นประกันสังคม') || selectedDocType?.name?.includes('สปส.')
          const isWorkRules = selectedDocType?.name?.includes('ระเบียบข้อบังคับเกี่ยวกับการทำงาน') || selectedDocType?.name?.toLowerCase().includes('work rules')
          const isEmploymentContract = selectedDocType?.name?.includes('สัญญาจ้างงาน') || selectedDocType?.name?.toLowerCase().includes('employment')
          const isEmployeeProfile = selectedDocType?.name?.includes('ประวัติพนักงาน') || selectedDocType?.name?.toLowerCase().includes('employee profile')
          const isBusinessPlan = selectedDocType?.name?.includes('แผนธุรกิจ') || selectedDocType?.name?.toLowerCase().includes('business plan')
          const isSOP = selectedDocType?.name?.includes('คู่มือการปฏิบัติงาน') || selectedDocType?.name?.includes('SOP')
          const isVendorContract = selectedDocType?.name?.includes('สัญญาคู่ค้า') || selectedDocType?.name?.toLowerCase().includes('vendor')
          const isMeetingMinutes = selectedDocType?.name?.includes('รายงานการประชุม') || selectedDocType?.name?.toLowerCase().includes('meeting')
          const isInventoryRecord = selectedDocType?.name?.includes('สินค้าคงคลัง') || selectedDocType?.name?.toLowerCase().includes('inventory')
          const isPurchaseRequisition = selectedDocType?.name?.includes('ขออนุมัติจัดซื้อ') || selectedDocType?.name?.includes('PR')
          const isLeaseAgreement = selectedDocType?.name?.includes('สัญญาเช่าสำนักงาน') || selectedDocType?.name?.includes('สัญญาเช่า')
          const isMonthlyReport = selectedDocType?.name?.includes('รายงานผลการดำเนินงาน') || selectedDocType?.name?.includes('ประจำเดือน')
          const isCompanyRegs = selectedDocType?.name?.includes('ข้อบังคับบริษัท') || selectedDocType?.name?.toLowerCase().includes('regulation')
          const isMemo = selectedDocType?.name?.includes('บันทึกข้อความ') || selectedDocType?.name?.toLowerCase().includes('memo')
          const isQuotation = selectedDocType?.name?.includes('ใบเสนอราคา') || selectedDocType?.name?.toLowerCase().includes('quotation')
          const isReceipt = selectedDocType?.name?.includes('ใบเสร็จ') || selectedDocType?.name?.toUpperCase().includes('RE ') || selectedDocType?.name?.toUpperCase().includes('RECEIPT')
          const isTaxReport = selectedDocType?.name?.includes('รายงานภาษี') || selectedDocType?.name?.toLowerCase().includes('tax')
          const isMOU = selectedDocType?.name?.includes('บันทึกข้อตกลง') || selectedDocType?.name?.toUpperCase().includes('MOU')
          const isPO = selectedDocType?.name?.includes('ใบสั่งซื้อ') || selectedDocType?.name?.toUpperCase().includes('PO') || selectedDocType?.name?.toLowerCase().includes('purchase order')
          const isBizReg = selectedDocType?.name?.includes('ใบทะเบียนพาณิชย์') || selectedDocType?.name?.includes('ทะเบียนการค้า') || selectedDocType?.name?.toLowerCase().includes('business registration')
          const isPaymentVoucher = selectedDocType?.name?.includes('ใบสำคัญจ่าย') || selectedDocType?.name?.toLowerCase().includes('payment voucher') || selectedDocType?.name?.toUpperCase().includes('PV')
          const isReceiptVoucher = selectedDocType?.name?.includes('ใบสำคัญรับ') || selectedDocType?.name?.toLowerCase().includes('receipt voucher') || selectedDocType?.name?.toUpperCase().includes('RV')
          const isJournal = selectedDocType?.name?.includes('สมุดรายวัน') || selectedDocType?.name?.includes('บัญชีแยกประเภท') || selectedDocType?.name?.toLowerCase().includes('journal') || selectedDocType?.name?.toLowerCase().includes('ledger')
          const isBankStatement = selectedDocType?.name?.includes('Statement') || selectedDocType?.name?.toLowerCase().includes('statement') || selectedDocType?.name?.includes('สเตทเม้น')
          const isFixedAsset = selectedDocType?.name?.includes('ทะเบียนทรัพย์สิน') || selectedDocType?.name?.toLowerCase().includes('fixed asset') || selectedDocType?.name?.toLowerCase().includes('asset register')
          const isFinancialStatement = selectedDocType?.name?.includes('งบการเงิน') || selectedDocType?.name?.toLowerCase().includes('financial statement')
          const isInvoice = selectedDocType?.name?.includes('ใบแจ้งหนี้') || selectedDocType?.name?.includes('ใบวางบิล') || selectedDocType?.name?.toLowerCase().includes('invoice') || selectedDocType?.name?.toLowerCase().includes('billing note')
          const isWithholdingTax = selectedDocType?.name?.includes('หัก ณ ที่จ่าย') || selectedDocType?.name?.includes('50 ทวิ')
          
          if (isPayslip) {
            const basicSalary = Number(customData.basicSalary) || 0
            const allowances = Number(customData.allowances) || 0
            const overtime = Number(customData.overtime) || 0
            const bonus = Number(customData.bonus) || 0
            const totalIncome = basicSalary + allowances + overtime + bonus

            const taxDeduction = Number(customData.taxDeduction) || 0
            const socialSecurity = Number(customData.socialSecurity) || 0
            const providentFund = Number(customData.providentFund) || 0
            const otherDeductions = Number(customData.otherDeductions) || 0
            const totalDeduction = taxDeduction + socialSecurity + providentFund + otherDeductions

            const netSalary = totalIncome - totalDeduction

            // We must set some standard values so the payload doesn't break
            // (subtotal, grandTotal are used in the payload calculation)
            // But we don't need to mutate formData here, just render.
            // When saving, the dataJson will include customData.

            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <h3 className="font-bold text-emerald-600 dark:text-emerald-400">ข้อมูลเอกสารส่วนบุคคล - สลิปเงินเดือน (Payslip)</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 pb-2">ข้อมูลพนักงาน</div>
                    
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">รหัสพนักงาน</label>
                      <input type="text" value={customData.employeeCode || ''} onChange={e => setCustomData({...customData, employeeCode: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>
                    
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">ชื่อพนักงาน</label>
                      <input type="text" value={customData.employeeName || ''} onChange={e => setCustomData({...customData, employeeName: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>

                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">ตำแหน่ง</label>
                      <input type="text" value={customData.position || ''} onChange={e => setCustomData({...customData, position: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>

                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">แผนก</label>
                      <input type="text" value={customData.department || ''} onChange={e => setCustomData({...customData, department: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>

                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">วันที่จ่ายเงิน</label>
                      <input type="date" value={customData.paymentDate || ''} onChange={e => setCustomData({...customData, paymentDate: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                       <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">เงินได้สุทธิ (Net Salary)</div>
                       <div className="text-4xl font-light text-emerald-600 dark:text-emerald-400">{netSalary.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">ธนาคาร</label>
                      <input type="text" value={customData.bankName || ''} onChange={e => setCustomData({...customData, bankName: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>
                    
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">เลขที่บัญชี</label>
                      <input type="text" value={customData.accountNo || ''} onChange={e => setCustomData({...customData, accountNo: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
                  {/* รายได้ */}
                  <div className="space-y-4">
                    <div className="font-semibold text-gray-700 dark:text-gray-300 border-b border-emerald-100 pb-2">รายได้ (Income)</div>
                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">เงินเดือนพื้นฐาน</label>
                      <input type="number" value={customData.basicSalary || ''} onChange={e => setCustomData({...customData, basicSalary: Number(e.target.value)})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800 text-right" />
                    </div>
                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">ค่าล่วงเวลา (OT)</label>
                      <input type="number" value={customData.overtime || ''} onChange={e => setCustomData({...customData, overtime: Number(e.target.value)})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800 text-right" />
                    </div>
                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">เบี้ยเลี้ยง / อื่นๆ</label>
                      <input type="number" value={customData.allowances || ''} onChange={e => setCustomData({...customData, allowances: Number(e.target.value)})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800 text-right" />
                    </div>
                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">โบนัส</label>
                      <input type="number" value={customData.bonus || ''} onChange={e => setCustomData({...customData, bonus: Number(e.target.value)})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800 text-right" />
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 font-bold text-emerald-600 dark:text-emerald-400">
                      <span>รวมรายได้</span>
                      <span>{totalIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  </div>

                  {/* รายการหัก */}
                  <div className="space-y-4">
                    <div className="font-semibold text-gray-700 dark:text-gray-300 border-b border-red-100 pb-2">รายการหัก (Deductions)</div>
                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">ภาษีหัก ณ ที่จ่าย</label>
                      <input type="number" value={customData.taxDeduction || ''} onChange={e => setCustomData({...customData, taxDeduction: Number(e.target.value)})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800 text-right" />
                    </div>
                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">ประกันสังคม</label>
                      <input type="number" value={customData.socialSecurity || ''} onChange={e => setCustomData({...customData, socialSecurity: Number(e.target.value)})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800 text-right" />
                    </div>
                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">กองทุนสำรองเลี้ยงชีพ</label>
                      <input type="number" value={customData.providentFund || ''} onChange={e => setCustomData({...customData, providentFund: Number(e.target.value)})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800 text-right" />
                    </div>
                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300">หักอื่นๆ</label>
                      <input type="number" value={customData.otherDeductions || ''} onChange={e => setCustomData({...customData, otherDeductions: Number(e.target.value)})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800 text-right" />
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 font-bold text-red-500">
                      <span>รวมรายการหัก</span>
                      <span>{totalDeduction.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  </div>
                </div>
                
                {/* Remarks */}
                <div className="mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isBOJ5) {
            const shareholders = customData.shareholders || [{
              id: 1, name: '', idCard: '', nationality: 'ไทย', occupation: '', address: '', 
              shares: '', shareNumbers: '', paidAmount: '', registerDate: '', cancellationDate: ''
            }]

            const updateShareholder = (index: number, field: string, value: any) => {
              const newShareholders = [...shareholders]
              newShareholders[index] = { ...newShareholders[index], [field]: value }
              setCustomData({ ...customData, shareholders: newShareholders })
            }

            const addShareholder = () => {
              setCustomData({
                ...customData,
                shareholders: [...shareholders, {
                  id: shareholders.length + 1, name: '', idCard: '', nationality: 'ไทย', occupation: '', address: '', 
                  shares: '', shareNumbers: '', paidAmount: '', registerDate: '', cancellationDate: ''
                }]
              })
            }

            const removeShareholder = (index: number) => {
              if (shareholders.length <= 1) return;
              const newShareholders = shareholders.filter((_: any, i: number) => i !== index)
              setCustomData({ ...customData, shareholders: newShareholders })
            }

            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                {/* Part A: Header Information */}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <h3 className="font-bold text-emerald-700 dark:text-emerald-400 mb-6 text-lg">ข้อมูลบริษัทและการประชุม</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ทะเบียนเลขที่</label>
                      <input type="text" value={customData.registrationNumber || ''} onChange={e => setCustomData({...customData, registrationNumber: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประเภทการประชุม</label>
                      <select value={customData.meetingType || ''} onChange={e => setCustomData({...customData, meetingType: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800">
                        <option value="">-- เลือกประเภทการประชุม --</option>
                        <option value="วันประชุมจัดตั้งบริษัท">วันประชุมจัดตั้งบริษัท</option>
                        <option value="สามัญผู้ถือหุ้น">สามัญผู้ถือหุ้น</option>
                        <option value="วิสามัญผู้ถือหุ้น">วิสามัญผู้ถือหุ้น</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ครั้งที่ (Meeting No.)</label>
                      <input type="text" value={customData.meetingNo || ''} onChange={e => setCustomData({...customData, meetingNo: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เมื่อวันที่ (Meeting Date)</label>
                      <input type="date" value={customData.meetingDate || ''} onChange={e => setCustomData({...customData, meetingDate: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>
                  </div>

                  <hr className="my-6 border-emerald-200 dark:border-emerald-800/50" />

                  <h3 className="font-bold text-emerald-700 dark:text-emerald-400 mb-6 text-lg">ข้อมูลทุนและหุ้น</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ทุนจดทะเบียน (บาท)</label>
                      <input type="number" value={customData.registeredCapital || ''} onChange={e => setCustomData({...customData, registeredCapital: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">แบ่งออกเป็น (หุ้น)</label>
                      <input type="number" value={customData.dividedInto || ''} onChange={e => setCustomData({...customData, dividedInto: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">มูลค่าหุ้นละ (บาท)</label>
                      <input type="number" value={customData.valuePerShare || ''} onChange={e => setCustomData({...customData, valuePerShare: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h4 className="font-bold text-sm mb-3">ผู้ถือหุ้นไทย</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">จำนวน (คน)</label>
                          <input type="number" value={customData.thaiShareholdersCount || ''} onChange={e => setCustomData({...customData, thaiShareholdersCount: e.target.value})} className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">จำนวน (หุ้น)</label>
                          <input type="number" value={customData.thaiShareholdersShares || ''} onChange={e => setCustomData({...customData, thaiShareholdersShares: e.target.value})} className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-700" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h4 className="font-bold text-sm mb-3">ผู้ถือหุ้นอื่นๆ</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">จำนวน (คน)</label>
                          <input type="number" value={customData.foreignShareholdersCount || ''} onChange={e => setCustomData({...customData, foreignShareholdersCount: e.target.value})} className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">จำนวน (หุ้น)</label>
                          <input type="number" value={customData.foreignShareholdersShares || ''} onChange={e => setCustomData({...customData, foreignShareholdersShares: e.target.value})} className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-700" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Part B: Shareholders Table */}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">บัญชีรายชื่อผู้ถือหุ้น</h3>
                  
                  <div className="border border-[#107e60]/20 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[1200px]">
                        <thead className="bg-[#107e60]/5 border-b border-[#107e60]/20 text-[#107e60]">
                          <tr>
                            <th className="px-3 py-3 font-semibold text-center w-12">ลำดับ</th>
                            <th className="px-3 py-3 font-semibold min-w-[200px]">ชื่อผู้ถือหุ้น</th>
                            <th className="px-3 py-3 font-semibold min-w-[150px]">เลขบัตรประชาชน/นิติบุคคล</th>
                            <th className="px-3 py-3 font-semibold w-24">สัญชาติ</th>
                            <th className="px-3 py-3 font-semibold w-32">อาชีพ</th>
                            <th className="px-3 py-3 font-semibold min-w-[200px]">ที่อยู่</th>
                            <th className="px-3 py-3 font-semibold w-24">จำนวนหุ้น</th>
                            <th className="px-3 py-3 font-semibold w-32">เลขหมายของหุ้น</th>
                            <th className="px-3 py-3 font-semibold w-32">เงินที่ชำระแล้ว</th>
                            <th className="px-3 py-3 font-semibold w-36">วันลงทะเบียน</th>
                            <th className="px-3 py-3 font-semibold w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                          {shareholders.map((sh: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-3 py-3 text-center text-gray-500">{index + 1}</td>
                              <td className="px-3 py-3">
                                <input type="text" value={sh.name} onChange={e => updateShareholder(index, 'name', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="ชื่อ-นามสกุล" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="text" value={sh.idCard} onChange={e => updateShareholder(index, 'idCard', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="เลขที่บัตร" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="text" value={sh.nationality} onChange={e => updateShareholder(index, 'nationality', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="ไทย" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="text" value={sh.occupation} onChange={e => updateShareholder(index, 'occupation', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="อาชีพ" />
                              </td>
                              <td className="px-3 py-3">
                                <textarea rows={1} value={sh.address} onChange={e => updateShareholder(index, 'address', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all resize-none" placeholder="ที่อยู่" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="number" value={sh.shares} onChange={e => updateShareholder(index, 'shares', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="0" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="text" value={sh.shareNumbers} onChange={e => updateShareholder(index, 'shareNumbers', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="1-100" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="number" value={sh.paidAmount} onChange={e => updateShareholder(index, 'paidAmount', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="0" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="date" value={sh.registerDate} onChange={e => updateShareholder(index, 'registerDate', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" />
                              </td>
                              <td className="px-3 py-3 text-center">
                                <button type="button" onClick={() => removeShareholder(index)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="ลบผู้ถือหุ้น">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="p-3 border-t border-[#107e60]/20 bg-[#107e60]/5">
                      <button type="button" onClick={addShareholder} className="flex items-center gap-2 text-sm font-medium text-[#107e60] hover:text-emerald-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-[#107e60]/10">
                        <Plus className="w-4 h-4" /> เพิ่มผู้ถือหุ้น
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isPK0401) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800 max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบสำคัญแสดงการจดทะเบียนบริษัท (พค.0401)</h2>
                    <p className="text-gray-500 mt-2">กรมพัฒนาธุรกิจการค้า กระทรวงพาณิชย์</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขทะเบียนนิติบุคคล</label>
                        <input type="text" value={customData.pk0401_registrationNumber || ''} onChange={e => setCustomData({...customData, pk0401_registrationNumber: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="เลขที่จดทะเบียน 13 หลัก" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อบริษัท / ห้างหุ้นส่วน</label>
                        <input type="text" value={customData.pk0401_companyName || ''} onChange={e => setCustomData({...customData, pk0401_companyName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="ชื่อนิติบุคคล" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่จดทะเบียนนิติบุคคล</label>
                        <input type="date" value={customData.pk0401_registrationDate || ''} onChange={e => setCustomData({...customData, pk0401_registrationDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ออกให้ ณ วันที่ (Issue Date)</label>
                        <input type="date" value={customData.pk0401_issueDate || ''} onChange={e => setCustomData({...customData, pk0401_issueDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">นายทะเบียน (Registrar)</label>
                      <input type="text" value={customData.pk0401_registrarName || ''} onChange={e => setCustomData({...customData, pk0401_registrarName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="ชื่อ-นามสกุล นายทะเบียน" />
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-emerald-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isBOJ2) {
            const promoters = customData.promoters || [{
              id: 1, name: '', idCard: '', age: '', nationality: 'ไทย', occupation: '', address: '', sharesSubscribed: ''
            }]

            const updatePromoter = (index: number, field: string, value: any) => {
              const newPromoters = [...promoters]
              newPromoters[index] = { ...newPromoters[index], [field]: value }
              setCustomData({ ...customData, promoters: newPromoters })
            }

            const addPromoter = () => {
              setCustomData({
                ...customData,
                promoters: [...promoters, {
                  id: promoters.length + 1, name: '', idCard: '', age: '', nationality: 'ไทย', occupation: '', address: '', sharesSubscribed: ''
                }]
              })
            }

            const removePromoter = (index: number) => {
              if (promoters.length <= 1) return;
              const newPromoters = promoters.filter((_: any, i: number) => i !== index)
              setCustomData({ ...customData, promoters: newPromoters })
            }

            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">หนังสือบริคณห์สนธิ (บอจ.2)</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อบริษัท (ตามที่ขอจดทะเบียน)</label>
                        <input type="text" value={customData.boj2_companyName || ''} onChange={e => setCustomData({...customData, boj2_companyName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="ตัวอย่าง: บริษัท เอบีซี จำกัด" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สำนักงานตั้งอยู่ ณ (จังหวัด)</label>
                        <input type="text" value={customData.boj2_province || ''} onChange={e => setCustomData({...customData, boj2_province: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="ตัวอย่าง: กรุงเทพมหานคร" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วัตถุประสงค์มี (ข้อ)</label>
                        <input type="number" value={customData.boj2_objectivesCount || ''} onChange={e => setCustomData({...customData, boj2_objectivesCount: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="จำนวนข้อ" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ทุนจดทะเบียน (บาท)</label>
                        <input type="number" value={customData.boj2_capital || ''} onChange={e => setCustomData({...customData, boj2_capital: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="จำนวนเงิน" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">แบ่งออกเป็น (หุ้น)</label>
                        <input type="number" value={customData.boj2_dividedInto || ''} onChange={e => setCustomData({...customData, boj2_dividedInto: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="จำนวนหุ้น" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">มูลค่าหุ้นละ (บาท)</label>
                        <input type="number" value={customData.boj2_valuePerShare || ''} onChange={e => setCustomData({...customData, boj2_valuePerShare: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="ราคาต่อหุ้น" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promoters Table */}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">รายชื่อผู้เริ่มก่อการ (Promoters)</h3>
                  
                  <div className="border border-[#107e60]/20 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[1000px]">
                        <thead className="bg-[#107e60]/5 border-b border-[#107e60]/20 text-[#107e60]">
                          <tr>
                            <th className="px-3 py-3 font-semibold text-center w-12">ลำดับ</th>
                            <th className="px-3 py-3 font-semibold min-w-[200px]">ชื่อผู้เริ่มก่อการ</th>
                            <th className="px-3 py-3 font-semibold w-40">เลขบัตรประชาชน</th>
                            <th className="px-3 py-3 font-semibold w-20">อายุ (ปี)</th>
                            <th className="px-3 py-3 font-semibold w-24">สัญชาติ</th>
                            <th className="px-3 py-3 font-semibold w-32">อาชีพ</th>
                            <th className="px-3 py-3 font-semibold min-w-[200px]">ที่อยู่</th>
                            <th className="px-3 py-3 font-semibold w-32">จำนวนหุ้นที่จองซื้อ</th>
                            <th className="px-3 py-3 font-semibold w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                          {promoters.map((p: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-3 py-3 text-center text-gray-500">{index + 1}</td>
                              <td className="px-3 py-3">
                                <input type="text" value={p.name} onChange={e => updatePromoter(index, 'name', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="ชื่อ-นามสกุล" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="text" value={p.idCard} onChange={e => updatePromoter(index, 'idCard', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="เลขประจำตัว 13 หลัก" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="number" value={p.age} onChange={e => updatePromoter(index, 'age', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="อายุ" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="text" value={p.nationality} onChange={e => updatePromoter(index, 'nationality', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="ไทย" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="text" value={p.occupation} onChange={e => updatePromoter(index, 'occupation', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="อาชีพ" />
                              </td>
                              <td className="px-3 py-3">
                                <textarea rows={1} value={p.address} onChange={e => updatePromoter(index, 'address', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all resize-none" placeholder="ที่อยู่" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="number" value={p.sharesSubscribed} onChange={e => updatePromoter(index, 'sharesSubscribed', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-[#38A1C5] rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="จำนวนหุ้น" />
                              </td>
                              <td className="px-3 py-3 text-center">
                                <button type="button" onClick={() => removePromoter(index)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="ลบผู้เริ่มก่อการ">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="p-3 border-t border-[#107e60]/20 bg-[#107e60]/5">
                      <button type="button" onClick={addPromoter} className="flex items-center gap-2 text-sm font-medium text-[#107e60] hover:text-emerald-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-[#107e60]/10">
                        <Plus className="w-4 h-4" /> เพิ่มผู้เริ่มก่อการ
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-emerald-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isMSM) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">รายงานการประชุมตั้งบริษัท (Minutes of the Statutory Meeting)</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อบริษัท</label>
                        <input type="text" value={customData.msm_companyName || ''} onChange={e => setCustomData({...customData, msm_companyName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="ชื่อบริษัทจำกัด" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันและเวลาที่ประชุม</label>
                        <input type="datetime-local" value={customData.msm_meetingDate || ''} onChange={e => setCustomData({...customData, msm_meetingDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สถานที่ประชุม</label>
                        <input type="text" value={customData.msm_meetingLocation || ''} onChange={e => setCustomData({...customData, msm_meetingLocation: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="สถานที่จัดประชุม" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประธานในที่ประชุม</label>
                        <input type="text" value={customData.msm_chairman || ''} onChange={e => setCustomData({...customData, msm_chairman: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="ชื่อประธาน" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ผู้ถือหุ้นเข้าประชุม (คน)</label>
                        <input type="number" value={customData.msm_totalShareholders || ''} onChange={e => setCustomData({...customData, msm_totalShareholders: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="จำนวนคน" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">นับรวมกันได้ (หุ้น)</label>
                        <input type="number" value={customData.msm_totalShares || ''} onChange={e => setCustomData({...customData, msm_totalShares: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="จำนวนหุ้น" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วาระการประชุม และ มติที่ประชุม</label>
                      <textarea rows={8} value={customData.msm_agenda || ''} onChange={e => setCustomData({...customData, msm_agenda: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="รายละเอียดวาระการประชุม และมติที่ประชุม..." />
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-emerald-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isIDCardCopy) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800 max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">สำเนาบัตรประชาชนและทะเบียนบ้านของกรรมการ</h2>
                    <p className="text-gray-500 mt-2">กรุณากรอกข้อมูลกรรมการและแนบไฟล์เอกสารในระบบ</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อ-นามสกุล กรรมการ</label>
                        <input type="text" value={customData.idCopy_directorName || ''} onChange={e => setCustomData({...customData, idCopy_directorName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="ชื่อ-นามสกุล" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวประชาชน</label>
                        <input type="text" value={customData.idCopy_idCard || ''} onChange={e => setCustomData({...customData, idCopy_idCard: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="เลขที่ 13 หลัก" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ตามทะเบียนบ้าน</label>
                      <textarea rows={3} value={customData.idCopy_address || ''} onChange={e => setCustomData({...customData, idCopy_address: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-800" placeholder="ที่อยู่" />
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-emerald-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isPND) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-[#38A1C5]/10 p-6 rounded-xl border border-[#38A1C5]/20 max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">แบบยื่นภาษีเงินได้หัก ณ ที่จ่าย (ภ.ง.ด.1, 3, 53)</h2>
                    <p className="text-gray-500 mt-2">กรมสรรพากร (Revenue Department)</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประเภทแบบยื่น</label>
                        <select value={customData.tax_formType || ''} onChange={e => setCustomData({...customData, tax_formType: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800">
                          <option value="">-- เลือกประเภท --</option>
                          <option value="ภ.ง.ด.1">ภ.ง.ด.1 (เงินเดือน ค่าจ้าง)</option>
                          <option value="ภ.ง.ด.3">ภ.ง.ด.3 (บุคคลธรรมดา)</option>
                          <option value="ภ.ง.ด.53">ภ.ง.ด.53 (นิติบุคคล)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เดือนที่จ่ายเงินได้</label>
                        <select value={customData.tax_month || ''} onChange={e => setCustomData({...customData, tax_month: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800">
                          <option value="">-- เลือกเดือน --</option>
                          <option value="01">มกราคม</option>
                          <option value="02">กุมภาพันธ์</option>
                          <option value="03">มีนาคม</option>
                          <option value="04">เมษายน</option>
                          <option value="05">พฤษภาคม</option>
                          <option value="06">มิถุนายน</option>
                          <option value="07">กรกฎาคม</option>
                          <option value="08">สิงหาคม</option>
                          <option value="09">กันยายน</option>
                          <option value="10">ตุลาคม</option>
                          <option value="11">พฤศจิกายน</option>
                          <option value="12">ธันวาคม</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ปีภาษี (พ.ศ.)</label>
                        <input type="text" value={customData.tax_year || ''} onChange={e => setCustomData({...customData, tax_year: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" placeholder="เช่น 2566" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อผู้มีหน้าที่หักภาษี ณ ที่จ่าย</label>
                        <input type="text" value={customData.tax_companyName || ''} onChange={e => setCustomData({...customData, tax_companyName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" placeholder="ชื่อบริษัทหรือบุคคล" />
                      </div>
                      <div className="grid grid-cols-[2fr_1fr] gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษีอากร</label>
                          <input type="text" value={customData.tax_taxId || ''} onChange={e => setCustomData({...customData, tax_taxId: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" placeholder="เลข 13 หลัก" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สาขาที่</label>
                          <input type="text" value={customData.tax_branch || ''} onChange={e => setCustomData({...customData, tax_branch: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" placeholder="00000" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#38A1C5]/20">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รวมยอดเงินได้พึงประเมินที่จ่าย</label>
                        <input type="number" value={customData.tax_totalIncome || ''} onChange={e => setCustomData({...customData, tax_totalIncome: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รวมยอดภาษีที่นำส่ง</label>
                        <input type="number" value={customData.tax_totalTax || ''} onChange={e => setCustomData({...customData, tax_totalTax: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เงินเพิ่ม (ถ้ามี)</label>
                        <input type="number" value={customData.tax_surcharge || ''} onChange={e => setCustomData({...customData, tax_surcharge: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isPP30) {
            const sales = Number(customData.vat_salesAmount) || 0
            const zeroRate = Number(customData.vat_zeroRateSales) || 0
            const exempt = Number(customData.vat_exemptSales) || 0
            const taxableSales = Math.max(0, sales - zeroRate - exempt)
            const outputTax = taxableSales * 0.07
            
            const purchase = Number(customData.vat_purchaseAmount) || 0
            const inputTax = purchase * 0.07

            const taxPayable = outputTax > inputTax ? outputTax - inputTax : 0
            const taxRefundable = inputTax > outputTax ? inputTax - outputTax : 0

            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-[#38A1C5]/10 p-6 rounded-xl border border-[#38A1C5]/20 max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">แบบแสดงรายการภาษีมูลค่าเพิ่ม (ภ.พ.30)</h2>
                    <p className="text-gray-500 mt-2">กรมสรรพากร (Revenue Department)</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เดือนภาษี</label>
                        <select value={customData.vat_month || ''} onChange={e => setCustomData({...customData, vat_month: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800">
                          <option value="">-- เลือกเดือน --</option>
                          <option value="01">มกราคม</option>
                          <option value="02">กุมภาพันธ์</option>
                          <option value="03">มีนาคม</option>
                          <option value="04">เมษายน</option>
                          <option value="05">พฤษภาคม</option>
                          <option value="06">มิถุนายน</option>
                          <option value="07">กรกฎาคม</option>
                          <option value="08">สิงหาคม</option>
                          <option value="09">กันยายน</option>
                          <option value="10">ตุลาคม</option>
                          <option value="11">พฤศจิกายน</option>
                          <option value="12">ธันวาคม</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ปีภาษี (พ.ศ.)</label>
                        <input type="text" value={customData.vat_year || ''} onChange={e => setCustomData({...customData, vat_year: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" placeholder="เช่น 2566" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประเภทการยื่น</label>
                        <select value={customData.vat_type || ''} onChange={e => setCustomData({...customData, vat_type: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800">
                          <option value="ปกติ">ยื่นปกติ</option>
                          <option value="เพิ่มเติม">ยื่นเพิ่มเติม</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[#38A1C5]/20">
                      {/* ฝั่งยอดขาย */}
                      <div className="space-y-4">
                        <h3 className="font-bold text-[#38A1C5]">ภาษีขาย (Output Tax)</h3>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">1. ยอดขายในเดือนนี้</label>
                          <input type="number" value={customData.vat_salesAmount || ''} onChange={e => setCustomData({...customData, vat_salesAmount: e.target.value})} className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">2. หัก ยอดขายที่เสียภาษี 0%</label>
                          <input type="number" value={customData.vat_zeroRateSales || ''} onChange={e => setCustomData({...customData, vat_zeroRateSales: e.target.value})} className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">3. หัก ยอดขายที่ได้รับยกเว้น</label>
                          <input type="number" value={customData.vat_exemptSales || ''} onChange={e => setCustomData({...customData, vat_exemptSales: e.target.value})} className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">4. ยอดขายที่ต้องเสียภาษี (1-2-3)</label>
                          <div className="font-mono text-right">{taxableSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                        <div className="p-3 bg-[#38A1C5]/10 rounded-lg border border-[#38A1C5]/20">
                          <label className="block text-xs font-bold text-[#38A1C5] mb-1">5. ภาษีขาย (4 x 7%)</label>
                          <div className="font-mono font-bold text-right text-[#38A1C5]">{outputTax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                      </div>

                      {/* ฝั่งยอดซื้อ */}
                      <div className="space-y-4">
                        <h3 className="font-bold text-[#38A1C5]">ภาษีซื้อ (Input Tax)</h3>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">6. ยอดซื้อที่มีสิทธินำมาหักภาษี</label>
                          <input type="number" value={customData.vat_purchaseAmount || ''} onChange={e => setCustomData({...customData, vat_purchaseAmount: e.target.value})} className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                        </div>
                        <div className="p-3 bg-[#38A1C5]/10 rounded-lg border border-[#38A1C5]/20">
                          <label className="block text-xs font-bold text-[#38A1C5] mb-1">7. ภาษีซื้อ (6 x 7%)</label>
                          <div className="font-mono font-bold text-right text-[#38A1C5]">{inputTax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3">สรุปยอดภาษี</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                              <label className="block text-xs text-red-600 dark:text-red-400 mb-1">8. ภาษีที่ต้องชำระ (ถ้า 5 &gt; 7)</label>
                              <div className="font-mono font-bold text-right text-red-600 dark:text-red-400">{taxPayable.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30">
                              <label className="block text-xs text-green-600 dark:text-green-400 mb-1">9. ภาษีที่ชำระเกิน (ถ้า 7 &gt; 5)</label>
                              <div className="font-mono font-bold text-right text-green-600 dark:text-green-400">{taxRefundable.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isTaxInvoice) {
            const invoiceItems = customData.invoice_items || [{
              id: 1, description: '', quantity: 1, unitPrice: 0, amount: 0
            }]

            const updateInvoiceItem = (index: number, field: string, value: any) => {
              const newItems = [...invoiceItems]
              newItems[index] = { ...newItems[index], [field]: value }
              
              if (field === 'quantity' || field === 'unitPrice') {
                const qty = Number(newItems[index].quantity) || 0
                const price = Number(newItems[index].unitPrice) || 0
                newItems[index].amount = qty * price
              }
              
              // Calculate totals
              const subtotal = newItems.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0)
              const vat = subtotal * 0.07
              const grandTotal = subtotal + vat

              setCustomData({ 
                ...customData, 
                invoice_items: newItems,
                invoice_subtotal: subtotal,
                invoice_vat: vat,
                invoice_grandTotal: grandTotal
              })
            }

            const addInvoiceItem = () => {
              setCustomData({
                ...customData,
                invoice_items: [...invoiceItems, {
                  id: invoiceItems.length + 1, description: '', quantity: 1, unitPrice: 0, amount: 0
                }]
              })
            }

            const removeInvoiceItem = (index: number) => {
              if (invoiceItems.length <= 1) return;
              const newItems = invoiceItems.filter((_: any, i: number) => i !== index)
              
              // Calculate totals
              const subtotal = newItems.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0)
              const vat = subtotal * 0.07
              const grandTotal = subtotal + vat

              setCustomData({ 
                ...customData, 
                invoice_items: newItems,
                invoice_subtotal: subtotal,
                invoice_vat: vat,
                invoice_grandTotal: grandTotal
              })
            }

            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-sky-50 dark:bg-sky-900/10 p-6 rounded-xl border border-sky-100 dark:border-sky-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบกำกับภาษี (Tax Invoice)</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประเภท</label>
                        <select value={customData.invoice_type || ''} onChange={e => setCustomData({...customData, invoice_type: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-800">
                          <option value="">-- เลือกประเภท --</option>
                          <option value="ขาย">ใบกำกับภาษีขาย (Sales Tax Invoice)</option>
                          <option value="ซื้อ">ใบกำกับภาษีซื้อ (Purchase Tax Invoice)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขที่ใบกำกับภาษี (Invoice No.)</label>
                        <input type="text" value={customData.invoice_number || ''} onChange={e => setCustomData({...customData, invoice_number: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-800" placeholder="INV-..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ออกเอกสาร (Date)</label>
                        <input type="date" value={customData.invoice_date || ''} onChange={e => setCustomData({...customData, invoice_date: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-800" />
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800">
                      <h3 className="font-bold text-sky-700 dark:text-sky-400 mb-4">ข้อมูลลูกค้า / ผู้ซื้อ (Customer Info)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อผู้ซื้อ (Name)</label>
                          <input type="text" value={customData.invoice_buyerName || ''} onChange={e => setCustomData({...customData, invoice_buyerName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="ชื่อบริษัทหรือบุคคล" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                          <input type="text" value={customData.invoice_buyerTaxId || ''} onChange={e => setCustomData({...customData, invoice_buyerTaxId: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="13 หลัก" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สาขาที่ (Branch)</label>
                          <input type="text" value={customData.invoice_buyerBranch || ''} onChange={e => setCustomData({...customData, invoice_buyerBranch: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="สำนักงานใหญ่ หรือ 00000" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ (Address)</label>
                          <textarea rows={2} value={customData.invoice_buyerAddress || ''} onChange={e => setCustomData({...customData, invoice_buyerAddress: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="ที่อยู่ผู้ซื้อ" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">รายการสินค้า / บริการ (Items)</h3>
                  
                  <div className="border border-sky-200 dark:border-sky-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-sky-50 dark:bg-sky-900/20 border-b border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300">
                          <tr>
                            <th className="px-3 py-3 font-semibold text-center w-12">ลำดับ</th>
                            <th className="px-3 py-3 font-semibold min-w-[300px]">รายการ (Description)</th>
                            <th className="px-3 py-3 font-semibold text-right w-32">จำนวน (Qty)</th>
                            <th className="px-3 py-3 font-semibold text-right w-40">ราคา/หน่วย (Unit Price)</th>
                            <th className="px-3 py-3 font-semibold text-right w-40">จำนวนเงิน (Amount)</th>
                            <th className="px-3 py-3 font-semibold w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                          {invoiceItems.map((item: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-3 py-3 text-center text-gray-500">{index + 1}</td>
                              <td className="px-3 py-3">
                                <input type="text" value={item.description} onChange={e => updateInvoiceItem(index, 'description', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-sky-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="รายละเอียด" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="number" min="0" value={item.quantity} onChange={e => updateInvoiceItem(index, 'quantity', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-sky-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-right" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateInvoiceItem(index, 'unitPrice', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-sky-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-right" />
                              </td>
                              <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300 font-mono">
                                {Number(item.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <button type="button" onClick={() => removeInvoiceItem(index)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="ลบรายการ">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-800/50 border-t border-sky-200 dark:border-sky-800">
                          <tr>
                            <td colSpan={3} rowSpan={3} className="px-4 py-2 align-top text-gray-500 text-xs">
                              * ภาษีมูลค่าเพิ่มคำนวณในอัตราร้อยละ 7
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-600 dark:text-gray-300 text-xs">รวมเงิน (Subtotal)</td>
                            <td className="px-3 py-2 text-right font-mono font-bold">{Number(customData.invoice_subtotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td></td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-right font-bold text-gray-600 dark:text-gray-300 text-xs">ภาษีมูลค่าเพิ่ม (VAT 7%)</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-sky-600">{Number(customData.invoice_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td></td>
                          </tr>
                          <tr>
                            <td className="px-3 py-3 text-right font-bold text-gray-900 dark:text-white">จำนวนเงินทั้งสิ้น (Grand Total)</td>
                            <td className="px-3 py-3 text-right font-mono font-bold text-lg text-emerald-600">{Number(customData.invoice_grandTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    <div className="p-3 border-t border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/10">
                      <button type="button" onClick={addInvoiceItem} className="flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/40">
                        <Plus className="w-4 h-4" /> เพิ่มรายการ (Add Item)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (is50Tawi) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-100 dark:border-amber-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)</h2>
                    <p className="text-gray-500 mt-2">ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เล่มที่ / เลขที่</label>
                        <input type="text" value={customData.tawi_documentNo || ''} onChange={e => setCustomData({...customData, tawi_documentNo: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-800" placeholder="ระบุเล่มที่ และเลขที่" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วัน/เดือน/ปี ที่ออกหนังสือ</label>
                        <input type="date" value={customData.tawi_issueDate || ''} onChange={e => setCustomData({...customData, tawi_issueDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-800" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ผู้มีหน้าที่หักภาษี ณ ที่จ่าย */}
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-800/50 space-y-4">
                        <h3 className="font-bold text-amber-700 dark:text-amber-500 border-b border-amber-100 dark:border-amber-800/50 pb-2">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</h3>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อ (ผู้จ่ายเงิน)</label>
                          <input type="text" value={customData.tawi_withholderName || ''} onChange={e => setCustomData({...customData, tawi_withholderName: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษีอากร</label>
                          <input type="text" value={customData.tawi_withholderTaxId || ''} onChange={e => setCustomData({...customData, tawi_withholderTaxId: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="13 หลัก" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่</label>
                          <textarea rows={2} value={customData.tawi_withholderAddress || ''} onChange={e => setCustomData({...customData, tawi_withholderAddress: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" />
                        </div>
                      </div>

                      {/* ผู้ถูกหักภาษี ณ ที่จ่าย */}
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-800/50 space-y-4">
                        <h3 className="font-bold text-amber-700 dark:text-amber-500 border-b border-amber-100 dark:border-amber-800/50 pb-2">ผู้ถูกหักภาษี ณ ที่จ่าย</h3>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อ (ผู้รับเงิน)</label>
                          <input type="text" value={customData.tawi_payeeName || ''} onChange={e => setCustomData({...customData, tawi_payeeName: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษีอากร</label>
                          <input type="text" value={customData.tawi_payeeTaxId || ''} onChange={e => setCustomData({...customData, tawi_payeeTaxId: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="13 หลัก" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่</label>
                          <textarea rows={2} value={customData.tawi_payeeAddress || ''} onChange={e => setCustomData({...customData, tawi_payeeAddress: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-800/50">
                      <h3 className="font-bold text-amber-700 dark:text-amber-500 mb-4">รายละเอียดเงินได้</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประเภทเงินได้พึงประเมิน</label>
                          <input type="text" value={customData.tawi_incomeType || ''} onChange={e => setCustomData({...customData, tawi_incomeType: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="เช่น ค่าจ้างทำของ, ค่าเช่า, เงินเดือน" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">จำนวนเงินที่จ่าย</label>
                          <input type="number" value={customData.tawi_incomeAmount || ''} onChange={e => setCustomData({...customData, tawi_incomeAmount: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ภาษีที่หักและนำส่งไว้</label>
                          <input type="number" value={customData.tawi_taxAmount || ''} onChange={e => setCustomData({...customData, tawi_taxAmount: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="0.00" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-amber-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isPP20) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-[#38A1C5]/10 p-6 rounded-xl border border-[#38A1C5]/20 max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบทะเบียนภาษีมูลค่าเพิ่ม (ภ.พ.20)</h2>
                    <p className="text-gray-500 mt-2">กรมสรรพากร (Revenue Department)</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษีอากร</label>
                        <input type="text" value={customData.pp20_taxId || ''} onChange={e => setCustomData({...customData, pp20_taxId: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" placeholder="13 หลัก" />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อผู้ประกอบการ</label>
                        <input type="text" value={customData.pp20_companyName || ''} onChange={e => setCustomData({...customData, pp20_companyName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อสถานประกอบการ</label>
                        <input type="text" value={customData.pp20_branchName || ''} onChange={e => setCustomData({...customData, pp20_branchName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่ตั้งสถานประกอบการ</label>
                        <textarea rows={3} value={customData.pp20_address || ''} onChange={e => setCustomData({...customData, pp20_address: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ให้ไว้ ณ วันที่</label>
                        <input type="date" value={customData.pp20_issueDate || ''} onChange={e => setCustomData({...customData, pp20_issueDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isPND50) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-[#38A1C5]/10 p-6 rounded-xl border border-[#38A1C5]/20 max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">แบบแสดงรายการภาษีเงินได้นิติบุคคล (ภ.ง.ด.50, 51)</h2>
                    <p className="text-gray-500 mt-2">กรมสรรพากร (Revenue Department)</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประเภทแบบ</label>
                        <select value={customData.pnd50_formType || ''} onChange={e => setCustomData({...customData, pnd50_formType: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800">
                          <option value="">-- เลือกประเภท --</option>
                          <option value="ภ.ง.ด.50">ภ.ง.ด.50 (สิ้นรอบระยะเวลาบัญชี)</option>
                          <option value="ภ.ง.ด.51">ภ.ง.ด.51 (ครึ่งรอบระยะเวลาบัญชี)</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-[#38A1C5]/20">
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สำหรับรอบระยะเวลาบัญชี เริ่มตั้งแต่</label>
                          <input type="date" value={customData.pnd50_periodStart || ''} onChange={e => setCustomData({...customData, pnd50_periodStart: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ถึงวันที่</label>
                          <input type="date" value={customData.pnd50_periodEnd || ''} onChange={e => setCustomData({...customData, pnd50_periodEnd: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-700" />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อบริษัทหรือห้างหุ้นส่วนนิติบุคคล</label>
                        <input type="text" value={customData.pnd50_companyName || ''} onChange={e => setCustomData({...customData, pnd50_companyName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษีอากร</label>
                        <input type="text" value={customData.pnd50_taxId || ''} onChange={e => setCustomData({...customData, pnd50_taxId: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-800" placeholder="13 หลัก" />
                      </div>

                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-[#38A1C5]/20">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">กำไรสุทธิ / ประมาณการกำไรสุทธิ</label>
                        <input type="number" value={customData.pnd50_netProfit || ''} onChange={e => setCustomData({...customData, pnd50_netProfit: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-700" placeholder="0.00" />
                      </div>

                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-[#38A1C5]/20">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ภาษีที่คำนวณได้</label>
                        <input type="number" value={customData.pnd50_taxAmount || ''} onChange={e => setCustomData({...customData, pnd50_taxAmount: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-[#38A1C5]/50 dark:bg-gray-700" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isTimesheet) {
            const timesheetRecords = customData.timesheet_records || [{
              id: 1, date: '', checkIn: '', checkOut: '', breakStart: '', breakEnd: '', totalHours: 0, otHours: 0, remarks: ''
            }]

            const updateTimesheetRecord = (index: number, field: string, value: any) => {
              const newRecords = [...timesheetRecords]
              newRecords[index] = { ...newRecords[index], [field]: value }
              setCustomData({ ...customData, timesheet_records: newRecords })
            }

            const addTimesheetRecord = () => {
              setCustomData({
                ...customData,
                timesheet_records: [...timesheetRecords, {
                  id: timesheetRecords.length + 1, date: '', checkIn: '', checkOut: '', breakStart: '', breakEnd: '', totalHours: 0, otHours: 0, remarks: ''
                }]
              })
            }

            const removeTimesheetRecord = (index: number) => {
              if (timesheetRecords.length <= 1) return;
              const newRecords = timesheetRecords.filter((_: any, i: number) => i !== index)
              setCustomData({ ...customData, timesheet_records: newRecords })
            }

            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบบันทึกเวลาทำงาน (Timesheet)</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประจำเดือน / ปี</label>
                        <input type="month" value={customData.timesheet_month || ''} onChange={e => setCustomData({...customData, timesheet_month: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-800" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รหัสพนักงาน (Emp ID)</label>
                        <input type="text" value={customData.timesheet_employeeId || ''} onChange={e => setCustomData({...customData, timesheet_employeeId: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-800" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อ-นามสกุลพนักงาน</label>
                        <input type="text" value={customData.timesheet_employeeName || ''} onChange={e => setCustomData({...customData, timesheet_employeeName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-800" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ตำแหน่ง (Position)</label>
                        <input type="text" value={customData.timesheet_position || ''} onChange={e => setCustomData({...customData, timesheet_position: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-800" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">แผนก (Department)</label>
                        <input type="text" value={customData.timesheet_department || ''} onChange={e => setCustomData({...customData, timesheet_department: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-800" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timesheet Records Table */}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">บันทึกเวลาปฏิบัติงาน (Time Records)</h3>
                  
                  <div className="border border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[1000px]">
                        <thead className="bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                          <tr>
                            <th className="px-3 py-3 font-semibold text-center w-32">วันที่ (Date)</th>
                            <th className="px-3 py-3 font-semibold text-center w-28">เข้างาน (In)</th>
                            <th className="px-3 py-3 font-semibold text-center w-28">ออกงาน (Out)</th>
                            <th className="px-3 py-3 font-semibold text-center w-28">พัก (Break Start)</th>
                            <th className="px-3 py-3 font-semibold text-center w-28">กลับ (Break End)</th>
                            <th className="px-3 py-3 font-semibold text-center w-28">ชม.รวม (Total)</th>
                            <th className="px-3 py-3 font-semibold text-center w-28">OT (ชม.)</th>
                            <th className="px-3 py-3 font-semibold">หมายเหตุ</th>
                            <th className="px-3 py-3 font-semibold w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                          {timesheetRecords.map((record: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-2 py-2">
                                <input type="date" value={record.date} onChange={e => updateTimesheetRecord(index, 'date', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-indigo-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-xs" />
                              </td>
                              <td className="px-2 py-2">
                                <input type="time" value={record.checkIn} onChange={e => updateTimesheetRecord(index, 'checkIn', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-indigo-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-center" />
                              </td>
                              <td className="px-2 py-2">
                                <input type="time" value={record.checkOut} onChange={e => updateTimesheetRecord(index, 'checkOut', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-indigo-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-center" />
                              </td>
                              <td className="px-2 py-2">
                                <input type="time" value={record.breakStart} onChange={e => updateTimesheetRecord(index, 'breakStart', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-indigo-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-center" />
                              </td>
                              <td className="px-2 py-2">
                                <input type="time" value={record.breakEnd} onChange={e => updateTimesheetRecord(index, 'breakEnd', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-indigo-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-center" />
                              </td>
                              <td className="px-2 py-2">
                                <input type="number" step="0.5" min="0" value={record.totalHours} onChange={e => updateTimesheetRecord(index, 'totalHours', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-indigo-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-center" />
                              </td>
                              <td className="px-2 py-2">
                                <input type="number" step="0.5" min="0" value={record.otHours} onChange={e => updateTimesheetRecord(index, 'otHours', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-indigo-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-center" />
                              </td>
                              <td className="px-2 py-2">
                                <input type="text" value={record.remarks} onChange={e => updateTimesheetRecord(index, 'remarks', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-indigo-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" />
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button type="button" onClick={() => removeTimesheetRecord(index)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="ลบรายการ">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="p-3 border-t border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10">
                      <button type="button" onClick={addTimesheetRecord} className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40">
                        <Plus className="w-4 h-4" /> เพิ่มรายการ (Add Row)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-indigo-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isLeave) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-xl border border-rose-100 dark:border-rose-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">แบบฟอร์มขออนุมัติลางาน (Leave Request Form)</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่กรอกแบบฟอร์ม (Date)</label>
                        <input type="date" value={customData.leave_requestDate || ''} onChange={e => setCustomData({...customData, leave_requestDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-800" />
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-rose-100 dark:border-rose-800/50">
                        <div className="md:col-span-2 border-b border-rose-100 dark:border-rose-800/50 pb-2 mb-2">
                          <h3 className="font-bold text-rose-700 dark:text-rose-500">ข้อมูลพนักงาน (Employee Info)</h3>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อ-นามสกุลพนักงาน (Name)</label>
                          <input type="text" value={customData.leave_employeeName || ''} onChange={e => setCustomData({...customData, leave_employeeName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รหัสพนักงาน (Emp ID)</label>
                          <input type="text" value={customData.leave_employeeId || ''} onChange={e => setCustomData({...customData, leave_employeeId: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ตำแหน่ง (Position)</label>
                          <input type="text" value={customData.leave_position || ''} onChange={e => setCustomData({...customData, leave_position: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">แผนก (Department)</label>
                          <input type="text" value={customData.leave_department || ''} onChange={e => setCustomData({...customData, leave_department: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" />
                        </div>
                      </div>

                      <div className="md:col-span-2 p-4 bg-white dark:bg-gray-800 rounded-lg border border-rose-100 dark:border-rose-800/50 space-y-4">
                        <div className="border-b border-rose-100 dark:border-rose-800/50 pb-2 mb-2">
                          <h3 className="font-bold text-rose-700 dark:text-rose-500">รายละเอียดการลา (Leave Details)</h3>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">ประเภทการลา (Leave Type)</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="leaveType" checked={customData.leave_type === 'ลากิจ'} onChange={() => setCustomData({...customData, leave_type: 'ลากิจ'})} className="accent-rose-500 w-4 h-4" /> 
                              <span className="text-sm">ลากิจ (Personal)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="leaveType" checked={customData.leave_type === 'ลาป่วย'} onChange={() => setCustomData({...customData, leave_type: 'ลาป่วย'})} className="accent-rose-500 w-4 h-4" /> 
                              <span className="text-sm">ลาป่วย (Sick)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="leaveType" checked={customData.leave_type === 'ลาพักร้อน'} onChange={() => setCustomData({...customData, leave_type: 'ลาพักร้อน'})} className="accent-rose-500 w-4 h-4" /> 
                              <span className="text-sm">ลาพักร้อน (Annual)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="leaveType" checked={customData.leave_type === 'อื่นๆ'} onChange={() => setCustomData({...customData, leave_type: 'อื่นๆ'})} className="accent-rose-500 w-4 h-4" /> 
                              <span className="text-sm">อื่นๆ (Others)</span>
                            </label>
                          </div>
                        </div>

                        {customData.leave_type === 'อื่นๆ' && (
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ระบุประเภทการลา (Specify)</label>
                            <input type="text" value={customData.leave_typeOther || ''} onChange={e => setCustomData({...customData, leave_typeOther: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เนื่องจาก (Reason)</label>
                          <textarea rows={2} value={customData.leave_reason || ''} onChange={e => setCustomData({...customData, leave_reason: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ตั้งแต่วันที่ (Start Date)</label>
                            <input type="date" value={customData.leave_startDate || ''} onChange={e => setCustomData({...customData, leave_startDate: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ถึงวันที่ (End Date)</label>
                            <input type="date" value={customData.leave_endDate || ''} onChange={e => setCustomData({...customData, leave_endDate: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รวมเป็นเวลา (Total Days)</label>
                            <div className="flex items-center gap-2">
                              <input type="number" step="0.5" min="0" value={customData.leave_totalDays || ''} onChange={e => setCustomData({...customData, leave_totalDays: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" placeholder="0" />
                              <span className="text-gray-600 dark:text-gray-400 font-medium">วัน (Days)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ข้อมูลสำหรับติดต่อกรณีเร่งด่วน (Emergency Contact Info)</label>
                  <textarea rows={2} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-rose-500/50 dark:bg-gray-800" placeholder="เบอร์โทรศัพท์, ที่อยู่, หรือผู้ติดต่อฉุกเฉิน" />
                </div>
              </div>
            )
          }

          if (isSSO) {
            const ssoEmployees = customData.sso_employees || [{
              id: 1, idCard: '', name: '', wages: 0, contribution: 0
            }]

            const updateSsoEmployee = (index: number, field: string, value: any) => {
              const newEmployees = [...ssoEmployees]
              newEmployees[index] = { ...newEmployees[index], [field]: value }
              
              if (field === 'wages') {
                // Calculate 5% contribution (max 750)
                const wage = Number(value) || 0
                // Cap wage for calculation at 15000 (15000 * 5% = 750)
                const cappedWage = Math.min(Math.max(wage, 1650), 15000)
                newEmployees[index].contribution = Math.round(cappedWage * 0.05)
              }
              
              // Calculate totals
              const totalWages = newEmployees.reduce((sum: number, emp: any) => sum + (Number(emp.wages) || 0), 0)
              const totalContribution = newEmployees.reduce((sum: number, emp: any) => sum + (Number(emp.contribution) || 0), 0)

              setCustomData({ 
                ...customData, 
                sso_employees: newEmployees,
                sso_totalWages: totalWages,
                sso_totalContribution: totalContribution
              })
            }

            const addSsoEmployee = () => {
              setCustomData({
                ...customData,
                sso_employees: [...ssoEmployees, {
                  id: ssoEmployees.length + 1, idCard: '', name: '', wages: 0, contribution: 0
                }]
              })
            }

            const removeSsoEmployee = (index: number) => {
              if (ssoEmployees.length <= 1) return;
              const newEmployees = ssoEmployees.filter((_: any, i: number) => i !== index)
              
              // Calculate totals
              const totalWages = newEmployees.reduce((sum: number, emp: any) => sum + (Number(emp.wages) || 0), 0)
              const totalContribution = newEmployees.reduce((sum: number, emp: any) => sum + (Number(emp.contribution) || 0), 0)

              setCustomData({ 
                ...customData, 
                sso_employees: newEmployees,
                sso_totalWages: totalWages,
                sso_totalContribution: totalContribution
              })
            }

            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-xl border border-orange-100 dark:border-orange-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">เอกสารนำส่งเงินสมทบประกันสังคม (สปส. 1-10)</h2>
                    <p className="text-gray-500 mt-2">สำนักงานประกันสังคม (Social Security Office)</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อสถานประกอบการ (Employer Name)</label>
                        <input type="text" value={customData.sso_employerName || ''} onChange={e => setCustomData({...customData, sso_employerName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-800" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขที่บัญชีนายจ้าง (Employer Account No.)</label>
                        <input type="text" value={customData.sso_employerAccount || ''} onChange={e => setCustomData({...customData, sso_employerAccount: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-800" placeholder="10 หลัก" />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ลำดับที่สาขา (Branch No.)</label>
                        <input type="text" value={customData.sso_branchNo || ''} onChange={e => setCustomData({...customData, sso_branchNo: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-800" placeholder="000000" />
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-800/50">
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ค่าจ้างเดือน (Wages for Month)</label>
                          <select value={customData.sso_month || ''} onChange={e => setCustomData({...customData, sso_month: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700">
                            <option value="">-- เลือกเดือน --</option>
                            <option value="01">มกราคม (January)</option>
                            <option value="02">กุมภาพันธ์ (February)</option>
                            <option value="03">มีนาคม (March)</option>
                            <option value="04">เมษายน (April)</option>
                            <option value="05">พฤษภาคม (May)</option>
                            <option value="06">มิถุนายน (June)</option>
                            <option value="07">กรกฎาคม (July)</option>
                            <option value="08">สิงหาคม (August)</option>
                            <option value="09">กันยายน (September)</option>
                            <option value="10">ตุลาคม (October)</option>
                            <option value="11">พฤศจิกายน (November)</option>
                            <option value="12">ธันวาคม (December)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">พ.ศ. (Year)</label>
                          <input type="text" value={customData.sso_year || ''} onChange={e => setCustomData({...customData, sso_year: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" placeholder="256X" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employees Table */}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">รายละเอียดการนำส่งเงินสมทบ (Contribution Details)</h3>
                  
                  <div className="border border-orange-200 dark:border-orange-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300">
                          <tr>
                            <th className="px-3 py-3 font-semibold text-center w-12">ลำดับ</th>
                            <th className="px-3 py-3 font-semibold w-48">เลขบัตรประชาชน (ID Card)</th>
                            <th className="px-3 py-3 font-semibold min-w-[200px]">ชื่อ-สกุล (Name)</th>
                            <th className="px-3 py-3 font-semibold text-right w-40">ค่าจ้าง (Wages)</th>
                            <th className="px-3 py-3 font-semibold text-right w-40">เงินสมทบผู้ประกันตน (5%)</th>
                            <th className="px-3 py-3 font-semibold w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                          {ssoEmployees.map((emp: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-3 py-3 text-center text-gray-500">{index + 1}</td>
                              <td className="px-3 py-3">
                                <input type="text" value={emp.idCard} onChange={e => updateSsoEmployee(index, 'idCard', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-orange-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all font-mono text-sm" placeholder="13 หลัก" maxLength={13} />
                              </td>
                              <td className="px-3 py-3">
                                <input type="text" value={emp.name} onChange={e => updateSsoEmployee(index, 'name', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-orange-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder="คำนำหน้า ชื่อ นามสกุล" />
                              </td>
                              <td className="px-3 py-3">
                                <input type="number" min="0" value={emp.wages} onChange={e => updateSsoEmployee(index, 'wages', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-orange-400 rounded outline-none bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all text-right font-mono" placeholder="0.00" />
                              </td>
                              <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300 font-mono">
                                {Number(emp.contribution || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <button type="button" onClick={() => removeSsoEmployee(index)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="ลบรายการ">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-800/50 border-t border-orange-200 dark:border-orange-800">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-300">รวมเงิน (Total)</td>
                            <td className="px-3 py-3 text-right font-mono font-bold">{Number(customData.sso_totalWages || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td className="px-3 py-3 text-right font-mono font-bold text-orange-600">{Number(customData.sso_totalContribution || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td></td>
                          </tr>
                          <tr>
                            <td colSpan={6} className="px-4 py-2 text-xs text-gray-500 bg-white dark:bg-gray-900">
                              * หมายเหตุ: เงินสมทบคำนวณที่อัตราร้อยละ 5 จากค่าจ้างขั้นต่ำ 1,650 บาท และสูงสุดไม่เกิน 15,000 บาท (เงินสมทบสูงสุด 750 บาท) ระบบจะคำนวณให้อัตโนมัติ
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    <div className="p-3 border-t border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
                      <button type="button" onClick={addSsoEmployee} className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40">
                        <Plus className="w-4 h-4" /> เพิ่มรายชื่อผู้ประกันตน (Add Employee)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-orange-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isWorkRules) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-sky-50 dark:bg-sky-900/10 p-6 rounded-xl border border-sky-100 dark:border-sky-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ระเบียบข้อบังคับเกี่ยวกับการทำงาน (Work Rules & Regulations)</h2>
                    <p className="text-gray-500 mt-2">แบบฟอร์มข้อมูลสำหรับจัดทำระเบียบข้อบังคับเกี่ยวกับการทำงานของบริษัท</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลบริษัทและวันที่บังคับใช้ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      <div className="md:col-span-2 border-b border-sky-100 dark:border-sky-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-sky-700 dark:text-sky-500">1. ข้อมูลทั่วไป (General Info)</h3>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อสถานประกอบการ (Company Name)</label>
                        <input type="text" value={customData.work_rules_companyName || ''} onChange={e => setCustomData({...customData, work_rules_companyName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="บริษัท ..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่มีผลบังคับใช้ (Effective Date)</label>
                        <input type="date" value={customData.work_rules_effectiveDate || ''} onChange={e => setCustomData({...customData, work_rules_effectiveDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ระยะเวลาทดลองงาน (Probation Period)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.work_rules_probationPeriod || ''} onChange={e => setCustomData({...customData, work_rules_probationPeriod: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="เช่น 90 หรือ 119" />
                          <span className="text-gray-600 dark:text-gray-400">วัน</span>
                        </div>
                      </div>
                    </div>

                    {/* วันและเวลาทำงาน */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      <div className="md:col-span-2 border-b border-sky-100 dark:border-sky-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-sky-700 dark:text-sky-500">2. วันทำงาน และเวลาทำงาน (Working Days & Hours)</h3>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันทำงานปกติ (Working Days)</label>
                        <input type="text" value={customData.work_rules_workingDays || ''} onChange={e => setCustomData({...customData, work_rules_workingDays: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="เช่น วันจันทร์ ถึง วันศุกร์" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เวลาทำงานปกติ (Working Hours)</label>
                        <input type="text" value={customData.work_rules_workingHours || ''} onChange={e => setCustomData({...customData, work_rules_workingHours: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="เช่น 08:30 น. - 17:30 น." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เวลาพัก (Break Time)</label>
                        <input type="text" value={customData.work_rules_breakTime || ''} onChange={e => setCustomData({...customData, work_rules_breakTime: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="เช่น 12:00 น. - 13:00 น." />
                      </div>
                    </div>

                    {/* วันหยุดและวันลา */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      <div className="md:col-span-2 border-b border-sky-100 dark:border-sky-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-sky-700 dark:text-sky-500">3. วันหยุด และวันลา (Holidays & Leaves)</h3>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันหยุดประเพณี (Public Holidays)</label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">ไม่น้อยกว่าปีละ</span>
                          <input type="number" min="13" value={customData.work_rules_publicHolidays || ''} onChange={e => setCustomData({...customData, work_rules_publicHolidays: e.target.value})} className="w-24 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700 text-center" placeholder="13" />
                          <span className="text-gray-600 dark:text-gray-400">วัน</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันหยุดพักผ่อนประจำปี (Annual Leave)</label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">พนักงานทำงานครบ 1 ปี ลาได้</span>
                          <input type="number" min="6" value={customData.work_rules_annualLeave || ''} onChange={e => setCustomData({...customData, work_rules_annualLeave: e.target.value})} className="w-24 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700 text-center" placeholder="6" />
                          <span className="text-gray-600 dark:text-gray-400">วัน</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันลาป่วย (Sick Leave)</label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">ได้รับค่าจ้างปีละไม่เกิน</span>
                          <input type="number" min="30" value={customData.work_rules_sickLeave || ''} onChange={e => setCustomData({...customData, work_rules_sickLeave: e.target.value})} className="w-24 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700 text-center" placeholder="30" />
                          <span className="text-gray-600 dark:text-gray-400">วัน</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันลากิจ (Personal Leave)</label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">ลากิจเพื่อทำธุระจำเป็นปีละ</span>
                          <input type="number" min="3" value={customData.work_rules_personalLeave || ''} onChange={e => setCustomData({...customData, work_rules_personalLeave: e.target.value})} className="w-24 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700 text-center" placeholder="3" />
                          <span className="text-gray-600 dark:text-gray-400">วัน</span>
                        </div>
                      </div>
                    </div>

                    {/* การจ่ายค่าจ้าง */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      <div className="md:col-span-2 border-b border-sky-100 dark:border-sky-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-sky-700 dark:text-sky-500">4. การจ่ายค่าจ้าง (Salary Payment)</h3>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">กำหนดการจ่ายค่าจ้าง (Payment Schedule)</label>
                        <input type="text" value={customData.work_rules_salaryPaymentDate || ''} onChange={e => setCustomData({...customData, work_rules_salaryPaymentDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="เช่น ทุกสิ้นเดือน / ทุกวันที่ 30 ของเดือน / แบ่งจ่ายทุกวันที่ 15 และสิ้นเดือน" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-sky-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isEmploymentContract) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-teal-50 dark:bg-teal-900/10 p-6 rounded-xl border border-teal-100 dark:border-teal-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">สัญญาจ้างงาน (Employment Contract)</h2>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลนายจ้าง */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-teal-100 dark:border-teal-800/50">
                      <div className="md:col-span-2 border-b border-teal-100 dark:border-teal-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-teal-700 dark:text-teal-500">ส่วนที่ 1: ข้อมูลนายจ้าง (Employer Info)</h3>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อบริษัท / นายจ้าง (Employer Name)</label>
                        <input type="text" value={customData.contract_employerName || ''} onChange={e => setCustomData({...customData, contract_employerName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่ตั้งสำนักงาน (Office Address)</label>
                        <textarea rows={2} value={customData.contract_employerAddress || ''} onChange={e => setCustomData({...customData, contract_employerAddress: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" />
                      </div>
                    </div>

                    {/* ข้อมูลลูกจ้าง */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-teal-100 dark:border-teal-800/50">
                      <div className="md:col-span-2 border-b border-teal-100 dark:border-teal-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-teal-700 dark:text-teal-500">ส่วนที่ 2: ข้อมูลลูกจ้าง (Employee Info)</h3>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อ-นามสกุล (Employee Name)</label>
                        <input type="text" value={customData.contract_employeeName || ''} onChange={e => setCustomData({...customData, contract_employeeName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวประชาชน (ID Card)</label>
                        <input type="text" value={customData.contract_employeeIdCard || ''} onChange={e => setCustomData({...customData, contract_employeeIdCard: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" maxLength={13} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ตามทะเบียนบ้าน (Registered Address)</label>
                        <textarea rows={2} value={customData.contract_employeeAddress || ''} onChange={e => setCustomData({...customData, contract_employeeAddress: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" />
                      </div>
                    </div>

                    {/* รายละเอียดการจ้างงาน */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-teal-100 dark:border-teal-800/50">
                      <div className="md:col-span-2 border-b border-teal-100 dark:border-teal-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-teal-700 dark:text-teal-500">ส่วนที่ 3: ข้อตกลงการจ้าง (Employment Terms)</h3>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ตำแหน่ง (Position)</label>
                        <input type="text" value={customData.contract_position || ''} onChange={e => setCustomData({...customData, contract_position: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">แผนก (Department)</label>
                        <input type="text" value={customData.contract_department || ''} onChange={e => setCustomData({...customData, contract_department: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันเริ่มงาน (Start Date)</label>
                        <input type="date" value={customData.contract_startDate || ''} onChange={e => setCustomData({...customData, contract_startDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">อัตราค่าจ้าง (Salary) / เดือน</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.contract_salary || ''} onChange={e => setCustomData({...customData, contract_salary: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" placeholder="0.00" />
                          <span className="text-gray-600 dark:text-gray-400">บาท</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ระยะเวลาทดลองงาน (Probation)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.contract_probation || ''} onChange={e => setCustomData({...customData, contract_probation: e.target.value})} className="w-24 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700 text-center" placeholder="119" />
                          <span className="text-gray-600 dark:text-gray-400">วัน</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-teal-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isEmployeeProfile) {
            const documentChecklist = customData.empProfile_documents || []
            const handleCheckboxChange = (docName: string) => {
              if (documentChecklist.includes(docName)) {
                setCustomData({ ...customData, empProfile_documents: documentChecklist.filter((d: string) => d !== docName) })
              } else {
                setCustomData({ ...customData, empProfile_documents: [...documentChecklist, docName] })
              }
            }

            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ประวัติพนักงาน (Employee Profile)</h2>
                    <p className="text-gray-500 mt-2">ประวัติส่วนตัวและรายการเอกสารประกอบการสมัครงาน</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลส่วนตัว */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/50">
                      <div className="md:col-span-3 border-b border-purple-100 dark:border-purple-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-purple-700 dark:text-purple-500">1. ข้อมูลส่วนตัว (Personal Info)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">คำนำหน้า (Title)</label>
                        <select value={customData.empProfile_title || ''} onChange={e => setCustomData({...customData, empProfile_title: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700">
                          <option value="">-- เลือก --</option>
                          <option value="นาย">นาย (Mr.)</option>
                          <option value="นาง">นาง (Mrs.)</option>
                          <option value="นางสาว">นางสาว (Ms.)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อ (First Name)</label>
                        <input type="text" value={customData.empProfile_firstName || ''} onChange={e => setCustomData({...customData, empProfile_firstName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">นามสกุล (Last Name)</label>
                        <input type="text" value={customData.empProfile_lastName || ''} onChange={e => setCustomData({...customData, empProfile_lastName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวประชาชน (ID Card)</label>
                        <input type="text" value={customData.empProfile_idCard || ''} onChange={e => setCustomData({...customData, empProfile_idCard: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" maxLength={13} placeholder="13 หลัก" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันเกิด (Date of Birth)</label>
                        <input type="date" value={customData.empProfile_birthDate || ''} onChange={e => setCustomData({...customData, empProfile_birthDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สัญชาติ (Nationality)</label>
                        <input type="text" value={customData.empProfile_nationality || 'ไทย'} onChange={e => setCustomData({...customData, empProfile_nationality: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ศาสนา (Religion)</label>
                        <input type="text" value={customData.empProfile_religion || 'พุทธ'} onChange={e => setCustomData({...customData, empProfile_religion: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">กรุ๊ปเลือด (Blood Type)</label>
                        <select value={customData.empProfile_bloodType || ''} onChange={e => setCustomData({...customData, empProfile_bloodType: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700">
                          <option value="">-- เลือก --</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="O">O</option>
                          <option value="AB">AB</option>
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ปัจจุบัน (Current Address)</label>
                        <textarea rows={2} value={customData.empProfile_address || ''} onChange={e => setCustomData({...customData, empProfile_address: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                      </div>
                    </div>

                    {/* ข้อมูลติดต่อ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/50">
                      <div className="md:col-span-2 border-b border-purple-100 dark:border-purple-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-purple-700 dark:text-purple-500">2. ข้อมูลติดต่อ (Contact Info)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เบอร์โทรศัพท์ (Phone)</label>
                        <input type="text" value={customData.empProfile_phone || ''} onChange={e => setCustomData({...customData, empProfile_phone: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">อีเมล (Email)</label>
                        <input type="email" value={customData.empProfile_email || ''} onChange={e => setCustomData({...customData, empProfile_email: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                      </div>

                      <div className="md:col-span-2 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">บุคคลที่ติดต่อได้ในกรณีฉุกเฉิน (Emergency Contact)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อ-สกุล (Name)</label>
                            <input type="text" value={customData.empProfile_emergencyContact || ''} onChange={e => setCustomData({...customData, empProfile_emergencyContact: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ความสัมพันธ์ (Relationship) & เบอร์โทร</label>
                            <input type="text" value={customData.empProfile_emergencyPhone || ''} onChange={e => setCustomData({...customData, empProfile_emergencyPhone: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="เช่น บิดา - 089xxxxxxx" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* รายการเอกสารประกอบ */}
                    <div className="grid grid-cols-1 gap-4 p-5 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/50">
                      <div className="border-b border-purple-100 dark:border-purple-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-purple-700 dark:text-purple-500">3. เอกสารประกอบ (Document Checklist)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          'สำเนาบัตรประจำตัวประชาชน',
                          'สำเนาทะเบียนบ้าน',
                          'รูปถ่ายขนาด 1 นิ้ว / 2 นิ้ว',
                          'สำเนาวุฒิการศึกษา (Transcript)',
                          'สำเนาใบรับรองการเกณฑ์ทหาร (สด.43/สด.8)',
                          'ใบรับรองแพทย์',
                          'สำเนาหน้าสมุดบัญชีธนาคาร',
                          'เอกสารรับรองการทำงานจากที่เก่า'
                        ].map((docName, index) => (
                          <label key={index} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                            <input 
                              type="checkbox" 
                              checked={documentChecklist.includes(docName)}
                              onChange={() => handleCheckboxChange(docName)}
                              className="w-5 h-5 accent-purple-600 rounded border-gray-300 focus:ring-purple-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{docName}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-purple-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isBusinessPlan) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">แผนธุรกิจ (Business Plan)</h2>
                    <p className="text-gray-500 mt-2">รายละเอียดแบบร่างการดำเนินงานและแผนธุรกิจขององค์กร</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลพื้นฐานโครงการ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                      <div className="md:col-span-2 border-b border-indigo-100 dark:border-indigo-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-indigo-700 dark:text-indigo-500">1. ข้อมูลทั่วไป (General Info)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อโครงการ / แผนธุรกิจ (Project Name)</label>
                        <input type="text" value={customData.bp_projectName || ''} onChange={e => setCustomData({...customData, bp_projectName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="ระบุชื่อแผนธุรกิจ..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วัตถุประสงค์ (Objective)</label>
                        <textarea rows={3} value={customData.bp_objective || ''} onChange={e => setCustomData({...customData, bp_objective: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="เป้าหมายของแผนธุรกิจนี้คืออะไร..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">กลุ่มเป้าหมาย (Target Audience)</label>
                        <input type="text" value={customData.bp_targetAudience || ''} onChange={e => setCustomData({...customData, bp_targetAudience: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="กลุ่มลูกค้า หรือ ผู้รับประโยชน์..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ผู้รับผิดชอบ (Project Owner)</label>
                        <input type="text" value={customData.bp_author || ''} onChange={e => setCustomData({...customData, bp_author: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="ระบุชื่อ หรือ แผนกที่รับผิดชอบ..." />
                      </div>
                    </div>

                    {/* การดำเนินงานและงบประมาณ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                      <div className="md:col-span-2 border-b border-indigo-100 dark:border-indigo-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-indigo-700 dark:text-indigo-500">2. การดำเนินงาน (Operation & Budget)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ระยะเวลาดำเนินการ (Timeline)</label>
                        <input type="text" value={customData.bp_timeline || ''} onChange={e => setCustomData({...customData, bp_timeline: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="เช่น 1 ม.ค. - 31 มี.ค. 2567" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">งบประมาณ (Estimated Budget)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.bp_budget || ''} onChange={e => setCustomData({...customData, bp_budget: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="0.00" />
                          <span className="text-gray-600 dark:text-gray-400">บาท</span>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">กลยุทธ์การดำเนินงาน (Strategy)</label>
                        <textarea rows={4} value={customData.bp_strategy || ''} onChange={e => setCustomData({...customData, bp_strategy: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="อธิบายแผนการทำงาน หรือกลยุทธ์ที่ใช้เพื่อให้บรรลุเป้าหมาย..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ผลลัพธ์ที่คาดหวัง (Expected Outcome)</label>
                        <textarea rows={3} value={customData.bp_expectedOutcome || ''} onChange={e => setCustomData({...customData, bp_expectedOutcome: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="ตัวชี้วัดความสำเร็จ หรือผลลัพธ์เมื่อจบโครงการ..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-indigo-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isSOP) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-xl border border-orange-100 dark:border-orange-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">คู่มือการปฏิบัติงาน (Standard Operating Procedure - SOP)</h2>
                    <p className="text-gray-500 mt-2">เอกสารมาตรฐานขั้นตอนการปฏิบัติงานเพื่อใช้เป็นแนวทางในองค์กร</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลพื้นฐาน SOP */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-800/50">
                      <div className="md:col-span-2 border-b border-orange-100 dark:border-orange-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-orange-700 dark:text-orange-500">1. ข้อมูลทั่วไป (General Info)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อคู่มือ / ขั้นตอน (SOP Title)</label>
                        <input type="text" value={customData.sop_title || ''} onChange={e => setCustomData({...customData, sop_title: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" placeholder="เช่น ขั้นตอนการขออนุมัติจัดซื้อ..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">แผนกที่รับผิดชอบ (Department)</label>
                        <input type="text" value={customData.sop_department || ''} onChange={e => setCustomData({...customData, sop_department: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" placeholder="ระบุแผนก..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่บังคับใช้ (Effective Date)</label>
                        <input type="date" value={customData.sop_effectiveDate || ''} onChange={e => setCustomData({...customData, sop_effectiveDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ครั้งที่แก้ไข (Revision No.)</label>
                        <input type="text" value={customData.sop_revision || ''} onChange={e => setCustomData({...customData, sop_revision: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" placeholder="เช่น 00, 01, 1.0" />
                      </div>
                    </div>

                    {/* รายละเอียด SOP */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-800/50">
                      <div className="border-b border-orange-100 dark:border-orange-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-orange-700 dark:text-orange-500">2. รายละเอียดขั้นตอน (Procedure Details)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วัตถุประสงค์ (Objective/Purpose)</label>
                        <textarea rows={2} value={customData.sop_objective || ''} onChange={e => setCustomData({...customData, sop_objective: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" placeholder="จัดทำขึ้นเพื่อ..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ขอบเขต (Scope)</label>
                        <textarea rows={2} value={customData.sop_scope || ''} onChange={e => setCustomData({...customData, sop_scope: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" placeholder="ครอบคลุมตั้งแต่ขั้นตอนใด ถึงขั้นตอนใด บุคคลใดที่เกี่ยวข้อง..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">คำจำกัดความ (Definitions) - ถ้ามี</label>
                        <textarea rows={2} value={customData.sop_definitions || ''} onChange={e => setCustomData({...customData, sop_definitions: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" placeholder="อธิบายความหมายของคำศัพท์เฉพาะที่ใช้..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ขั้นตอนการปฏิบัติงาน (Procedures)</label>
                        <textarea rows={8} value={customData.sop_procedures || ''} onChange={e => setCustomData({...customData, sop_procedures: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 font-mono text-sm" placeholder={`1. ผู้ขออนุมัติกรอกฟอร์ม...\n2. ผู้จัดการแผนกตรวจสอบและอนุมัติ...\n3. ฝ่ายจัดซื้อดำเนินการสั่งซื้อ...`} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เอกสารอ้างอิง (References)</label>
                        <textarea rows={2} value={customData.sop_references || ''} onChange={e => setCustomData({...customData, sop_references: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" placeholder="อ้างอิง ISO, กฎหมาย หรือเอกสารที่เกี่ยวข้อง..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-orange-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isVendorContract) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">สัญญาคู่ค้า / สัญญาผู้ให้บริการ (Vendor Contract)</h2>
                    <p className="text-gray-500 mt-2">ข้อตกลงและเงื่อนไขการว่าจ้างผู้ให้บริการภายนอก</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลคู่สัญญา */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800/50">
                      <div className="md:col-span-2 border-b border-blue-100 dark:border-blue-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-blue-700 dark:text-blue-500">1. ข้อมูลคู่สัญญา (Parties)</h3>
                      </div>
                      
                      <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">ผู้ว่าจ้าง (Party A)</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อบริษัท / นิติบุคคล (Company Name)</label>
                            <input type="text" value={customData.vendorContract_partyA_name || ''} onChange={e => setCustomData({...customData, vendorContract_partyA_name: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700" placeholder="ระบุชื่อผู้ว่าจ้าง..." />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ (Address)</label>
                            <textarea rows={2} value={customData.vendorContract_partyA_address || ''} onChange={e => setCustomData({...customData, vendorContract_partyA_address: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700" />
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">ผู้รับจ้าง / ผู้ให้บริการ (Party B - Vendor)</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อบริษัท / นิติบุคคล (Vendor Name)</label>
                            <input type="text" value={customData.vendorContract_partyB_name || ''} onChange={e => setCustomData({...customData, vendorContract_partyB_name: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700" placeholder="ระบุชื่อผู้รับจ้าง..." />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ (Address)</label>
                            <textarea rows={2} value={customData.vendorContract_partyB_address || ''} onChange={e => setCustomData({...customData, vendorContract_partyB_address: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* รายละเอียดสัญญา */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800/50">
                      <div className="md:col-span-2 border-b border-blue-100 dark:border-blue-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-blue-700 dark:text-blue-500">2. รายละเอียดสัญญา (Contract Details)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รายละเอียดการให้บริการ (Service Description)</label>
                        <textarea rows={4} value={customData.vendorContract_serviceDescription || ''} onChange={e => setCustomData({...customData, vendorContract_serviceDescription: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700" placeholder="ระบุขอบเขตงาน (Scope of Work) หรืองานที่ว่าจ้าง..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ทำสัญญา (Contract Date)</label>
                        <input type="date" value={customData.vendorContract_contractDate || ''} onChange={e => setCustomData({...customData, vendorContract_contractDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ระยะเวลาสัญญา (Duration)</label>
                        <input type="text" value={customData.vendorContract_duration || ''} onChange={e => setCustomData({...customData, vendorContract_duration: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700" placeholder="เช่น 1 ปี, 6 เดือน, หรือจนกว่างานจะแล้วเสร็จ" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">มูลค่าสัญญา / ค่าตอบแทน (Contract Amount)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.vendorContract_amount || ''} onChange={e => setCustomData({...customData, vendorContract_amount: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700" placeholder="0.00" />
                          <span className="text-gray-600 dark:text-gray-400">บาท</span>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เงื่อนไขการชำระเงิน (Payment Terms)</label>
                        <textarea rows={3} value={customData.vendorContract_paymentTerms || ''} onChange={e => setCustomData({...customData, vendorContract_paymentTerms: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700" placeholder="เช่น แบ่งจ่าย 3 งวด, งวดละ 30%..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-blue-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isMeetingMinutes) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-fuchsia-50 dark:bg-fuchsia-900/10 p-6 rounded-xl border border-fuchsia-100 dark:border-fuchsia-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">รายงานการประชุม (Meeting Minutes)</h2>
                    <p className="text-gray-500 mt-2">บันทึกวาระการประชุม มติที่ประชุม และข้อตกลงเพื่อใช้เป็นหลักฐานการทำงาน</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลการประชุม */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-fuchsia-100 dark:border-fuchsia-800/50">
                      <div className="md:col-span-2 border-b border-fuchsia-100 dark:border-fuchsia-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-fuchsia-700 dark:text-fuchsia-500">1. ข้อมูลการประชุม (Meeting Info)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หัวข้อการประชุม (Meeting Title)</label>
                        <input type="text" value={customData.meeting_title || ''} onChange={e => setCustomData({...customData, meeting_title: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700" placeholder="ระบุหัวข้อ..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ประชุม (Date)</label>
                        <input type="date" value={customData.meeting_date || ''} onChange={e => setCustomData({...customData, meeting_date: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เวลา (Time)</label>
                        <input type="text" value={customData.meeting_time || ''} onChange={e => setCustomData({...customData, meeting_time: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700" placeholder="เช่น 10:00 - 12:00 น." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สถานที่ / ช่องทาง (Location / Platform)</label>
                        <input type="text" value={customData.meeting_location || ''} onChange={e => setCustomData({...customData, meeting_location: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700" placeholder="ห้องประชุม 1 หรือ Zoom / Google Meet..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รายชื่อผู้เข้าร่วมประชุม (Attendees)</label>
                        <textarea rows={3} value={customData.meeting_attendees || ''} onChange={e => setCustomData({...customData, meeting_attendees: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700" placeholder="ระบุชื่อหรือตำแหน่งของผู้ที่เข้าร่วมประชุม..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รายชื่อผู้ไม่มาประชุม (Absentees) - ถ้ามี</label>
                        <textarea rows={2} value={customData.meeting_absentees || ''} onChange={e => setCustomData({...customData, meeting_absentees: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700" placeholder="ระบุรายชื่อผู้ลางานหรือผู้ที่ติดภารกิจ..." />
                      </div>
                    </div>

                    {/* วาระและมติที่ประชุม */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-fuchsia-100 dark:border-fuchsia-800/50">
                      <div className="border-b border-fuchsia-100 dark:border-fuchsia-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-fuchsia-700 dark:text-fuchsia-500">2. วาระและมติที่ประชุม (Agendas & Resolutions)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วาระการประชุม และ ข้อหารือ (Agendas & Discussions)</label>
                        <textarea rows={6} value={customData.meeting_agenda || ''} onChange={e => setCustomData({...customData, meeting_agenda: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700" placeholder={`วาระที่ 1: ...\nวาระที่ 2: ...`} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">มติที่ประชุม / ข้อตกลง (Decisions / Resolutions)</label>
                        <textarea rows={4} value={customData.meeting_decisions || ''} onChange={e => setCustomData({...customData, meeting_decisions: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700" placeholder="สรุปข้อตกลงร่วมกัน หรือมติที่ได้รับการอนุมัติในที่ประชุม..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สิ่งที่ต้องดำเนินการต่อ (Action Items)</label>
                        <textarea rows={4} value={customData.meeting_actionItems || ''} onChange={e => setCustomData({...customData, meeting_actionItems: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700" placeholder="1. ให้คุณ... ดำเนินการ... ภายในวันที่...\n2. ให้คุณ... ติดตามผลเรื่อง..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-fuchsia-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isInventoryRecord) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">เอกสารควบคุมสินค้าคงคลัง (Inventory Record)</h2>
                    <p className="text-gray-500 mt-2">บันทึกการรับเข้า เบิกออก หรือตรวจนับสินค้าคงเหลือ</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลการทำรายการ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                      <div className="md:col-span-2 border-b border-emerald-100 dark:border-emerald-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-emerald-700 dark:text-emerald-500">1. ข้อมูลการทำรายการ (Transaction Info)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประเภทรายการ (Transaction Type)</label>
                        <select value={customData.inventory_type || ''} onChange={e => setCustomData({...customData, inventory_type: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700">
                          <option value="">-- เลือกประเภท --</option>
                          <option value="รับเข้า (In)">รับเข้า (Stock In)</option>
                          <option value="เบิกออก (Out)">เบิกออก (Stock Out)</option>
                          <option value="ตรวจนับ (Count)">ตรวจนับ (Stock Count)</option>
                          <option value="โอนย้าย (Transfer)">โอนย้าย (Transfer)</option>
                          <option value="ปรับปรุงยอด (Adjust)">ปรับปรุงยอด (Adjust)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ทำรายการ (Date)</label>
                        <input type="date" value={customData.inventory_date || ''} onChange={e => setCustomData({...customData, inventory_date: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เอกสารอ้างอิง (Ref. Document)</label>
                        <input type="text" value={customData.inventory_ref || ''} onChange={e => setCustomData({...customData, inventory_ref: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700" placeholder="เช่น เลขที่ PO, ใบส่งของ..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สถานที่เก็บ / คลังสินค้า (Location / Warehouse)</label>
                        <input type="text" value={customData.inventory_location || ''} onChange={e => setCustomData({...customData, inventory_location: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700" placeholder="ระบุคลังสินค้า..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ผู้รับผิดชอบ / ผู้บันทึก (Prepared By)</label>
                        <input type="text" value={customData.inventory_preparedBy || ''} onChange={e => setCustomData({...customData, inventory_preparedBy: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700" placeholder="ชื่อพนักงาน..." />
                      </div>
                    </div>

                    {/* รายการสินค้า */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                      <div className="border-b border-emerald-100 dark:border-emerald-800/50 pb-2 mb-2 flex justify-between items-end">
                        <h3 className="font-bold text-emerald-700 dark:text-emerald-500">2. รายการสินค้า (Items List)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รายละเอียดรายการสินค้า (Item Details)</label>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                          รูปแบบแนะนำ: รหัสสินค้า | ชื่อสินค้า | จำนวน | หน่วย | หมายเหตุ<br/>
                          เช่น: ITM001 | กระดาษ A4 | 50 | รีม | รับเข้าสต็อกปกติ
                        </div>
                        <textarea rows={6} value={customData.inventory_itemsText || ''} onChange={e => setCustomData({...customData, inventory_itemsText: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700 font-mono text-sm leading-relaxed" placeholder="1. ...\n2. ..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-emerald-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isPurchaseRequisition) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-xl border border-rose-100 dark:border-rose-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบขออนุมัติจัดซื้อ (Purchase Requisition - PR)</h2>
                    <p className="text-gray-500 mt-2">เอกสารขออนุมัติสั่งซื้อสินค้าหรือบริการภายในองค์กร</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลผู้ขอจัดซื้อ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-rose-100 dark:border-rose-800/50">
                      <div className="md:col-span-2 border-b border-rose-100 dark:border-rose-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-rose-700 dark:text-rose-500">1. ข้อมูลผู้ขอจัดซื้อ (Requester Info)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ผู้ขอจัดซื้อ (Requester)</label>
                        <input type="text" value={customData.pr_requester || ''} onChange={e => setCustomData({...customData, pr_requester: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" placeholder="ชื่อพนักงาน..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">แผนก (Department)</label>
                        <input type="text" value={customData.pr_department || ''} onChange={e => setCustomData({...customData, pr_department: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" placeholder="ระบุแผนก..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ขอจัดซื้อ (PR Date)</label>
                        <input type="date" value={customData.pr_date || ''} onChange={e => setCustomData({...customData, pr_date: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ต้องการใช้งาน (Needed By)</label>
                        <input type="date" value={customData.pr_neededBy || ''} onChange={e => setCustomData({...customData, pr_neededBy: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วัตถุประสงค์ในการจัดซื้อ (Purpose / Justification)</label>
                        <textarea rows={2} value={customData.pr_purpose || ''} onChange={e => setCustomData({...customData, pr_purpose: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" placeholder="อธิบายเหตุผลหรือความจำเป็นในการจัดซื้อ..." />
                      </div>
                    </div>

                    {/* รายการสินค้าที่ขอซื้อ */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-rose-100 dark:border-rose-800/50">
                      <div className="border-b border-rose-100 dark:border-rose-800/50 pb-2 mb-2 flex justify-between items-end">
                        <h3 className="font-bold text-rose-700 dark:text-rose-500">2. รายการสินค้าที่ขอซื้อ (Items List)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รายละเอียดรายการ (Item Details)</label>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                          รูปแบบแนะนำ: ลำดับ | รายการสินค้า | จำนวน | หน่วย | ราคาต่อหน่วย | ราคารวม<br/>
                          เช่น: 1 | แล็ปท็อป Dell XPS 15 | 1 | เครื่อง | 50,000 | 50,000
                        </div>
                        <textarea rows={6} value={customData.pr_itemsText || ''} onChange={e => setCustomData({...customData, pr_itemsText: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700 font-mono text-sm leading-relaxed" placeholder="1. ...\n2. ..." />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ยอดรวมโดยประมาณ (Estimated Total)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.pr_totalAmount || ''} onChange={e => setCustomData({...customData, pr_totalAmount: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" placeholder="0.00" />
                            <span className="text-gray-600 dark:text-gray-400">บาท</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ผู้ขายที่แนะนำ (Suggested Vendor)</label>
                          <input type="text" value={customData.pr_suggestedVendor || ''} onChange={e => setCustomData({...customData, pr_suggestedVendor: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" placeholder="ระบุชื่อร้านค้า หรือ บริษัทผู้ขาย (ถ้ามี)" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-rose-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isLeaseAgreement) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-100 dark:border-amber-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">สัญญาเช่าสำนักงานหรือพื้นที่ (Office / Space Lease Agreement)</h2>
                    <p className="text-gray-500 mt-2">ข้อตกลงการเช่าสถานที่สำหรับประกอบธุรกิจหรือเป็นสำนักงาน</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลคู่สัญญาเช่า */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-800/50">
                      <div className="md:col-span-2 border-b border-amber-100 dark:border-amber-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-amber-700 dark:text-amber-500">1. ข้อมูลคู่สัญญา (Parties)</h3>
                      </div>
                      
                      <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">ผู้ให้เช่า (Lessor)</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อผู้ให้เช่า (Lessor Name)</label>
                            <input type="text" value={customData.lease_lessor_name || ''} onChange={e => setCustomData({...customData, lease_lessor_name: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="ชื่อบุคคล หรือ นิติบุคคล ผู้เป็นเจ้าของสถานที่..." />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ (Address)</label>
                            <textarea rows={2} value={customData.lease_lessor_address || ''} onChange={e => setCustomData({...customData, lease_lessor_address: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" />
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2 bg-amber-50/50 dark:bg-amber-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-3">ผู้เช่า (Lessee)</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อผู้เช่า (Lessee Name)</label>
                            <input type="text" value={customData.lease_lessee_name || ''} onChange={e => setCustomData({...customData, lease_lessee_name: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="ชื่อบริษัท หรือ บุคคลที่ต้องการเช่า..." />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ (Address)</label>
                            <textarea rows={2} value={customData.lease_lessee_address || ''} onChange={e => setCustomData({...customData, lease_lessee_address: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* รายละเอียดสถานที่เช่า */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-800/50">
                      <div className="md:col-span-2 border-b border-amber-100 dark:border-amber-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-amber-700 dark:text-amber-500">2. รายละเอียดสถานที่เช่าและค่าตอบแทน (Property & Payment)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ทรัพย์สินที่เช่า / สถานที่เช่า (Leased Property / Premises)</label>
                        <textarea rows={2} value={customData.lease_property || ''} onChange={e => setCustomData({...customData, lease_property: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="ระบุรายละเอียดพื้นที่ เช่น อาคาร... ชั้น... ห้องเลขที่... พื้นที่... ตารางเมตร" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วัตถุประสงค์การเช่า (Purpose of Lease)</label>
                        <input type="text" value={customData.lease_purpose || ''} onChange={e => setCustomData({...customData, lease_purpose: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="เช่น เพื่อใช้เป็นสำนักงาน, ร้านค้า..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่เริ่มต้นสัญญา (Start Date)</label>
                        <input type="date" value={customData.lease_startDate || ''} onChange={e => setCustomData({...customData, lease_startDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่สิ้นสุดสัญญา (End Date)</label>
                        <input type="date" value={customData.lease_endDate || ''} onChange={e => setCustomData({...customData, lease_endDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" />
                      </div>
                      
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ค่าเช่าต่อเดือน (Monthly Rental Fee)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.lease_rentalFee || ''} onChange={e => setCustomData({...customData, lease_rentalFee: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="0.00" />
                            <span className="text-gray-600 dark:text-gray-400">บาท</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เงินมัดจำ / เงินประกัน (Security Deposit)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.lease_deposit || ''} onChange={e => setCustomData({...customData, lease_deposit: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="0.00" />
                            <span className="text-gray-600 dark:text-gray-400">บาท</span>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">กำหนดชำระเงิน (Payment Schedule)</label>
                          <textarea rows={2} value={customData.lease_paymentTerms || ''} onChange={e => setCustomData({...customData, lease_paymentTerms: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="เช่น ภายในวันที่ 5 ของทุกเดือน..." />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-amber-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isMonthlyReport) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-cyan-50 dark:bg-cyan-900/10 p-6 rounded-xl border border-cyan-100 dark:border-cyan-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">รายงานผลการดำเนินงานประจำเดือน (Monthly Performance Report)</h2>
                    <p className="text-gray-500 mt-2">สรุปผลงาน ปัญหา อุปสรรค และแผนงานในเดือนถัดไปของแต่ละแผนก</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลรายงาน */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-cyan-100 dark:border-cyan-800/50">
                      <div className="md:col-span-2 border-b border-cyan-100 dark:border-cyan-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-cyan-700 dark:text-cyan-500">1. ข้อมูลรายงาน (Report Info)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประจำเดือน (Month / Year)</label>
                        <input type="month" value={customData.monthlyReport_month || ''} onChange={e => setCustomData({...customData, monthlyReport_month: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-cyan-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">แผนก (Department)</label>
                        <input type="text" value={customData.monthlyReport_department || ''} onChange={e => setCustomData({...customData, monthlyReport_department: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-cyan-500/50 dark:bg-gray-700" placeholder="ระบุแผนก..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ผู้จัดทำรายงาน (Prepared By)</label>
                        <input type="text" value={customData.monthlyReport_preparedBy || ''} onChange={e => setCustomData({...customData, monthlyReport_preparedBy: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-cyan-500/50 dark:bg-gray-700" placeholder="ชื่อพนักงาน..." />
                      </div>
                    </div>

                    {/* รายละเอียดผลการดำเนินงาน */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-cyan-100 dark:border-cyan-800/50">
                      <div className="border-b border-cyan-100 dark:border-cyan-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-cyan-700 dark:text-cyan-500">2. รายละเอียดผลการดำเนินงาน (Performance Details)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สรุปผลการดำเนินงานภาพรวม (Executive Summary)</label>
                        <textarea rows={3} value={customData.monthlyReport_summary || ''} onChange={e => setCustomData({...customData, monthlyReport_summary: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-cyan-500/50 dark:bg-gray-700" placeholder="สรุปภาพรวมการทำงานในเดือนนี้..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ผลงานที่สำเร็จตามเป้าหมาย (Key Achievements)</label>
                        <textarea rows={4} value={customData.monthlyReport_achievements || ''} onChange={e => setCustomData({...customData, monthlyReport_achievements: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-cyan-500/50 dark:bg-gray-700" placeholder="1. ...\n2. ..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ปัญหา และ อุปสรรค (Issues / Challenges)</label>
                        <textarea rows={3} value={customData.monthlyReport_issues || ''} onChange={e => setCustomData({...customData, monthlyReport_issues: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-cyan-500/50 dark:bg-gray-700" placeholder="ระบุปัญหาที่พบในการทำงานเดือนนี้..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">แผนงานในเดือนถัดไป (Next Month Plan)</label>
                        <textarea rows={4} value={customData.monthlyReport_nextPlan || ''} onChange={e => setCustomData({...customData, monthlyReport_nextPlan: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-cyan-500/50 dark:bg-gray-700" placeholder="1. ...\n2. ..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-cyan-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isCompanyRegs) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ข้อบังคับบริษัท (Company Articles of Association / Regulations)</h2>
                    <p className="text-gray-500 mt-2">ระเบียบและข้อบังคับที่ใช้ในการบริหารจัดการภายในบริษัท</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลบริษัทและวันที่ประกาศใช้ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                      <div className="md:col-span-2 border-b border-indigo-100 dark:border-indigo-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-indigo-700 dark:text-indigo-500">1. ข้อมูลทั่วไป (General Info)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อบริษัท (Company Name)</label>
                        <input type="text" value={customData.companyReg_name || ''} onChange={e => setCustomData({...customData, companyReg_name: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="บริษัท..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ประกาศใช้ (Effective Date)</label>
                        <input type="date" value={customData.companyReg_date || ''} onChange={e => setCustomData({...customData, companyReg_date: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" />
                      </div>
                    </div>

                    {/* หมวดข้อบังคับ */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                      <div className="border-b border-indigo-100 dark:border-indigo-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-indigo-700 dark:text-indigo-500">2. รายละเอียดข้อบังคับ (Regulations Details)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมวดที่ 1 บททั่วไป (Chapter 1: General Provisions)</label>
                        <textarea rows={4} value={customData.companyReg_chapter1 || ''} onChange={e => setCustomData({...customData, companyReg_chapter1: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="ระบุข้อบังคับทั่วไป เช่น สำนักงานใหญ่ตั้งอยู่ที่ใด, ตราประทับบริษัท..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมวดที่ 2 หุ้นและผู้ถือหุ้น (Chapter 2: Shares and Shareholders)</label>
                        <textarea rows={4} value={customData.companyReg_chapter2 || ''} onChange={e => setCustomData({...customData, companyReg_chapter2: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="ระบุข้อบังคับเกี่ยวกับ การออกหุ้น, การโอนหุ้น..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมวดที่ 3 คณะกรรมการบริษัท (Chapter 3: Board of Directors)</label>
                        <textarea rows={4} value={customData.companyReg_chapter3 || ''} onChange={e => setCustomData({...customData, companyReg_chapter3: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="จำนวนกรรมการ, อำนาจหน้าที่, การเลือกตั้งกรรมการ..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมวดที่ 4 การประชุมผู้ถือหุ้น (Chapter 4: Shareholders' Meetings)</label>
                        <textarea rows={4} value={customData.companyReg_chapter4 || ''} onChange={e => setCustomData({...customData, companyReg_chapter4: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="ข้อกำหนดการเรียกประชุม, องค์ประชุม, การลงมติ..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมวดที่ 5 อื่นๆ (Chapter 5: Miscellaneous) - ถ้ามี</label>
                        <textarea rows={3} value={customData.companyReg_chapter5 || ''} onChange={e => setCustomData({...customData, companyReg_chapter5: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="เช่น การปันผล, การเลิกบริษัท..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-indigo-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isMemo) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-slate-50 dark:bg-slate-900/10 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">บันทึกข้อความ (Internal Memo)</h2>
                    <p className="text-gray-500 mt-2">เอกสารสำหรับติดต่อสื่อสาร สั่งการ หรือรายงานภายในองค์กร</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ส่วนหัวบันทึกข้อความ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-slate-800/50">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ส่วนราชการ / หน่วยงาน (Department / Header)</label>
                        <input type="text" value={customData.memo_header || ''} onChange={e => setCustomData({...customData, memo_header: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-slate-500/50 dark:bg-gray-700" placeholder="เช่น ฝ่ายทรัพยากรบุคคล โทร. 1234..." />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่ (Ref No.)</label>
                        <input type="text" value={customData.memo_no || ''} onChange={e => setCustomData({...customData, memo_no: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-slate-500/50 dark:bg-gray-700" placeholder="เช่น ศธ 04001/..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ (Date)</label>
                        <input type="date" value={customData.memo_date || ''} onChange={e => setCustomData({...customData, memo_date: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-slate-500/50 dark:bg-gray-700" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เรื่อง (Subject)</label>
                        <input type="text" value={customData.memo_subject || ''} onChange={e => setCustomData({...customData, memo_subject: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-slate-500/50 dark:bg-gray-700" placeholder="ระบุหัวเรื่อง..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เรียน (To)</label>
                        <input type="text" value={customData.memo_to || ''} onChange={e => setCustomData({...customData, memo_to: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-slate-500/50 dark:bg-gray-700" placeholder="ระบุชื่อหรือตำแหน่งของผู้รับ..." />
                      </div>
                    </div>

                    {/* ข้อความและลงชื่อ */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-slate-800/50">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ข้อความ / รายละเอียด (Body / Content)</label>
                        <textarea rows={10} value={customData.memo_content || ''} onChange={e => setCustomData({...customData, memo_content: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-slate-500/50 dark:bg-gray-700 leading-relaxed" placeholder="พิมพ์ข้อความรายละเอียดที่นี่..." />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 mt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="md:col-start-2 text-center space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ลงชื่อ (Signature / Prepared By)</label>
                            <div className="flex items-center gap-2 justify-center">
                              <span className="text-gray-500">(</span>
                              <input type="text" value={customData.memo_signature || ''} onChange={e => setCustomData({...customData, memo_signature: e.target.value})} className="w-full text-center p-2 border-b border-gray-300 dark:border-gray-600 outline-none focus:border-slate-500 bg-transparent dark:text-white" placeholder="พิมพ์ชื่อ-นามสกุล..." />
                              <span className="text-gray-500">)</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ตำแหน่ง (Position)</label>
                            <input type="text" value={customData.memo_position || ''} onChange={e => setCustomData({...customData, memo_position: e.target.value})} className="w-full text-center p-2 border-b border-gray-300 dark:border-gray-600 outline-none focus:border-slate-500 bg-transparent dark:text-white" placeholder="ตำแหน่ง..." />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-slate-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isQuotation) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-sky-50 dark:bg-sky-900/10 p-6 rounded-xl border border-sky-100 dark:border-sky-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบเสนอราคา (Quotation)</h2>
                    <p className="text-gray-500 mt-2">เอกสารเสนอราคาสินค้าหรือบริการให้แก่ลูกค้า</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลลูกค้าและเอกสาร */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      <div className="md:col-span-2 border-b border-sky-100 dark:border-sky-800/50 pb-2 mb-2 flex justify-between items-end">
                        <h3 className="font-bold text-sky-700 dark:text-sky-500">1. ข้อมูลลูกค้า (Customer Info)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อลูกค้า / บริษัท (Customer Name)</label>
                        <input type="text" value={customData.quotation_customerName || ''} onChange={e => setCustomData({...customData, quotation_customerName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="ระบุชื่อลูกค้า หรือ นิติบุคคล..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ลูกค้า (Customer Address)</label>
                        <textarea rows={2} value={customData.quotation_customerAddress || ''} onChange={e => setCustomData({...customData, quotation_customerAddress: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="ที่อยู่สำหรับออกใบเสนอราคา/ใบกำกับภาษี..." />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่เสนอราคา (Date)</label>
                        <input type="date" value={customData.quotation_date || ''} onChange={e => setCustomData({...customData, quotation_date: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ยืนราคาถึงวันที่ (Valid Until)</label>
                        <input type="date" value={customData.quotation_validUntil || ''} onChange={e => setCustomData({...customData, quotation_validUntil: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขที่อ้างอิง (Ref No. / Project Name)</label>
                        <input type="text" value={customData.quotation_refNo || ''} onChange={e => setCustomData({...customData, quotation_refNo: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="ชื่อโครงการ หรือ เลขที่เอกสารอ้างอิง (ถ้ามี)..." />
                      </div>
                    </div>

                    {/* รายการสินค้า/บริการและราคารวม */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      <div className="border-b border-sky-100 dark:border-sky-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-sky-700 dark:text-sky-500">2. รายการสินค้า / บริการ (Items)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รายละเอียดรายการ (Item Details)</label>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                          รูปแบบแนะนำ: ลำดับ | รายการสินค้า | จำนวน | หน่วย | ราคาต่อหน่วย | ราคารวม<br/>
                          เช่น: 1 | บริการออกแบบเว็บไซต์ | 1 | งาน | 50,000 | 50,000
                        </div>
                        <textarea rows={6} value={customData.quotation_itemsText || ''} onChange={e => setCustomData({...customData, quotation_itemsText: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700 font-mono text-sm leading-relaxed" placeholder="1. ...\n2. ..." />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รวมเป็นเงิน (Sub Total)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.quotation_subTotal || ''} onChange={e => setCustomData({...customData, quotation_subTotal: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="0.00" />
                            <span className="text-gray-600 dark:text-gray-400">บาท</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ภาษีมูลค่าเพิ่ม 7% (VAT)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.quotation_vat || ''} onChange={e => setCustomData({...customData, quotation_vat: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="0.00" />
                            <span className="text-gray-600 dark:text-gray-400">บาท</span>
                          </div>
                        </div>
                        <div className="md:col-span-2 lg:col-span-1">
                          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">ยอดสุทธิ (Grand Total)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.quotation_grandTotal || ''} onChange={e => setCustomData({...customData, quotation_grandTotal: e.target.value})} className="w-full p-2.5 border-2 border-sky-300 dark:border-sky-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 bg-sky-50 dark:bg-sky-900/30 text-lg font-bold text-sky-900 dark:text-sky-300" placeholder="0.00" />
                            <span className="font-bold text-gray-900 dark:text-white">บาท</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เงื่อนไขการชำระเงิน (Payment Terms)</label>
                        <textarea rows={3} value={customData.quotation_paymentTerms || ''} onChange={e => setCustomData({...customData, quotation_paymentTerms: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="เช่น ชำระมัดจำ 50% และส่วนที่เหลือชำระภายใน 30 วันหลังส่งมอบงาน..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-sky-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isReceipt) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบเสร็จรับเงิน (Receipt / RE Document)</h2>
                    <p className="text-gray-500 mt-2">เอกสารหลักฐานการรับเงินจากลูกค้าหรือบุคคลที่เกี่ยวข้อง</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลผู้ชำระเงิน */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                      <div className="md:col-span-2 border-b border-emerald-100 dark:border-emerald-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-emerald-700 dark:text-emerald-500">1. ข้อมูลการรับเงิน (Payment Details)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ได้รับเงินจาก (Received From)</label>
                        <input type="text" value={customData.receipt_customerName || ''} onChange={e => setCustomData({...customData, receipt_customerName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700" placeholder="ชื่อลูกค้า หรือ นิติบุคคล..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ (Address)</label>
                        <textarea rows={2} value={customData.receipt_customerAddress || ''} onChange={e => setCustomData({...customData, receipt_customerAddress: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700" placeholder="ที่อยู่ผู้ชำระเงิน..." />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่รับเงิน (Date)</label>
                        <input type="date" value={customData.receipt_date || ''} onChange={e => setCustomData({...customData, receipt_date: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขที่ใบเสร็จ (Receipt No.)</label>
                        <input type="text" value={customData.receipt_refNo || ''} onChange={e => setCustomData({...customData, receipt_refNo: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700" placeholder="เช่น RE-20231001..." />
                      </div>
                    </div>

                    {/* รายการชำระเงินและช่องทาง */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                      <div className="border-b border-emerald-100 dark:border-emerald-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-emerald-700 dark:text-emerald-500">2. รายการชำระเงิน (Items & Payment Method)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รายละเอียดการชำระเงิน (Payment For)</label>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                          รูปแบบแนะนำ: ลำดับ | รายการ | จำนวนเงิน<br/>
                          เช่น: 1 | ค่าบริการรายเดือน | 10,000
                        </div>
                        <textarea rows={5} value={customData.receipt_itemsText || ''} onChange={e => setCustomData({...customData, receipt_itemsText: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700 font-mono text-sm leading-relaxed" placeholder="1. ...\n2. ..." />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">จำนวนเงินรวมทั้งสิ้น (Total Amount)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.receipt_totalAmount || ''} onChange={e => setCustomData({...customData, receipt_totalAmount: e.target.value})} className="w-full p-2.5 border-2 border-emerald-300 dark:border-emerald-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/30 text-lg font-bold text-emerald-900 dark:text-emerald-300" placeholder="0.00" />
                            <span className="font-bold text-gray-900 dark:text-white">บาท</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วิธีการชำระเงิน (Payment Method)</label>
                          <select value={customData.receipt_paymentMethod || ''} onChange={e => setCustomData({...customData, receipt_paymentMethod: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700">
                            <option value="">-- เลือกวิธีการชำระเงิน --</option>
                            <option value="เงินสด (Cash)">เงินสด (Cash)</option>
                            <option value="โอนเงิน (Bank Transfer)">โอนเงิน (Bank Transfer)</option>
                            <option value="เช็ค (Cheque)">เช็ค (Cheque)</option>
                            <option value="บัตรเครดิต (Credit Card)">บัตรเครดิต (Credit Card)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ข้อมูลอ้างอิงการชำระเงิน (Payment Ref)</label>
                          <input type="text" value={customData.receipt_bankRef || ''} onChange={e => setCustomData({...customData, receipt_bankRef: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-gray-700" placeholder="เช่น ธนาคาร... เลขที่อ้างอิง... ลงวันที่..." />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-emerald-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isTaxReport) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">รายงานภาษีซื้อ / รายงานภาษีขาย (Tax Report)</h2>
                    <p className="text-gray-500 mt-2">รายงานสรุปข้อมูลภาษีมูลค่าเพิ่มประจำเดือนเพื่อนำส่งกรมสรรพากร</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลรายงานและผู้ประกอบการ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/50">
                      <div className="md:col-span-2 border-b border-purple-100 dark:border-purple-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-purple-700 dark:text-purple-500">1. ข้อมูลรายงานและผู้ประกอบการ (Report & Company Info)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประเภทรายงาน (Report Type)</label>
                        <select value={customData.taxReport_type || ''} onChange={e => setCustomData({...customData, taxReport_type: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700">
                          <option value="">-- เลือกประเภทรายงาน --</option>
                          <option value="รายงานภาษีซื้อ (Purchase Tax Report)">รายงานภาษีซื้อ (Purchase Tax Report)</option>
                          <option value="รายงานภาษีขาย (Sales Tax Report)">รายงานภาษีขาย (Sales Tax Report)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประจำเดือน / ปี (Month / Year)</label>
                        <input type="month" value={customData.taxReport_month || ''} onChange={e => setCustomData({...customData, taxReport_month: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อผู้ประกอบการ (Company Name)</label>
                        <input type="text" value={customData.taxReport_companyName || ''} onChange={e => setCustomData({...customData, taxReport_companyName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="ชื่อสถานประกอบการ..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                        <input type="text" value={customData.taxReport_taxId || ''} onChange={e => setCustomData({...customData, taxReport_taxId: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="เลขประจำตัว 13 หลัก..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สาขาที่ (Branch)</label>
                        <input type="text" value={customData.taxReport_branch || ''} onChange={e => setCustomData({...customData, taxReport_branch: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="เช่น สำนักงานใหญ่ หรือ สาขาที่ 00001..." />
                      </div>
                    </div>

                    {/* รายการภาษี */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/50">
                      <div className="border-b border-purple-100 dark:border-purple-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-purple-700 dark:text-purple-500">2. รายการเอกสาร (Tax Items List)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รายละเอียดรายการ (Item Details)</label>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded leading-relaxed">
                          รูปแบบแนะนำ: ลำดับ | วันที่ (ว/ด/ป) | เล่มที่/เลขที่ | ชื่อผู้ซื้อ/ผู้ขาย | สาขา | มูลค่าสินค้า | จำนวนเงินภาษี<br/>
                          เช่น: 1 | 01/10/2566 | 001/0150 | บจก. เอบีซี | สำนักงานใหญ่ | 100,000 | 7,000
                        </div>
                        <textarea rows={8} value={customData.taxReport_itemsText || ''} onChange={e => setCustomData({...customData, taxReport_itemsText: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700 font-mono text-sm leading-relaxed whitespace-pre" placeholder="1. ...\n2. ..." />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">รวมมูลค่าสินค้า/บริการ (Total Amount)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.taxReport_totalAmount || ''} onChange={e => setCustomData({...customData, taxReport_totalAmount: e.target.value})} className="w-full p-2.5 border-2 border-purple-300 dark:border-purple-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 bg-purple-50 dark:bg-purple-900/30 font-bold text-purple-900 dark:text-purple-300" placeholder="0.00" />
                            <span className="font-bold text-gray-900 dark:text-white">บาท</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">รวมจำนวนเงินภาษีมูลค่าเพิ่ม (Total VAT)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.taxReport_totalTax || ''} onChange={e => setCustomData({...customData, taxReport_totalTax: e.target.value})} className="w-full p-2.5 border-2 border-purple-300 dark:border-purple-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 bg-purple-50 dark:bg-purple-900/30 font-bold text-purple-900 dark:text-purple-300" placeholder="0.00" />
                            <span className="font-bold text-gray-900 dark:text-white">บาท</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-purple-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isMOU) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-xl border border-orange-100 dark:border-orange-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">บันทึกข้อตกลง (Memorandum of Understanding - MOU)</h2>
                    <p className="text-gray-500 mt-2">เอกสารข้อตกลงความร่วมมือระหว่างบุคคล องค์กร หรือหน่วยงาน</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลทั่วไปและคู่สัญญา */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-800/50">
                      <div className="md:col-span-2 border-b border-orange-100 dark:border-orange-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-orange-700 dark:text-orange-500">1. ข้อมูลทั่วไปและคู่สัญญา (General & Parties Info)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หัวข้อบันทึกข้อตกลง (MOU Title)</label>
                        <input type="text" value={customData.mou_title || ''} onChange={e => setCustomData({...customData, mou_title: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" placeholder="ระบุหัวเรื่องของความร่วมมือ..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ทำข้อตกลง (Date of Agreement)</label>
                        <input type="date" value={customData.mou_date || ''} onChange={e => setCustomData({...customData, mou_date: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" />
                      </div>
                      
                      <div className="bg-orange-50/50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800/30">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ฝ่ายที่ 1 (Party A)</label>
                        <textarea rows={3} value={customData.mou_partyA_name || ''} onChange={e => setCustomData({...customData, mou_partyA_name: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" placeholder="ชื่อองค์กร/บุคคล และที่อยู่..." />
                      </div>
                      <div className="bg-orange-50/50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800/30">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ฝ่ายที่ 2 (Party B)</label>
                        <textarea rows={3} value={customData.mou_partyB_name || ''} onChange={e => setCustomData({...customData, mou_partyB_name: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" placeholder="ชื่อองค์กร/บุคคล และที่อยู่..." />
                      </div>
                    </div>

                    {/* รายละเอียดข้อตกลง */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-800/50">
                      <div className="border-b border-orange-100 dark:border-orange-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-orange-700 dark:text-orange-500">2. รายละเอียดข้อตกลง (MOU Details)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วัตถุประสงค์ (Objectives / Purpose)</label>
                        <textarea rows={3} value={customData.mou_objective || ''} onChange={e => setCustomData({...customData, mou_objective: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 leading-relaxed" placeholder="จุดมุ่งหมายของความร่วมมือในครั้งนี้..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ข้อตกลงและเงื่อนไข (Terms & Conditions)</label>
                        <textarea rows={6} value={customData.mou_terms || ''} onChange={e => setCustomData({...customData, mou_terms: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 leading-relaxed" placeholder="1. ฝ่ายที่ 1 จะดำเนินการ...\n2. ฝ่ายที่ 2 จะดำเนินการ...\n3. ..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ระยะเวลาความร่วมมือ (Duration / Validity)</label>
                        <input type="text" value={customData.mou_duration || ''} onChange={e => setCustomData({...customData, mou_duration: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700" placeholder="เช่น มีผลบังคับใช้ 1 ปี นับตั้งแต่วันที่ลงนาม..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-orange-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isPO) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-teal-50 dark:bg-teal-900/10 p-6 rounded-xl border border-teal-100 dark:border-teal-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบสั่งซื้อ (Purchase Order)</h2>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลผู้ขายและเอกสาร */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-teal-100 dark:border-teal-800/50">
                      <div className="md:col-span-2 border-b border-teal-100 dark:border-teal-800/50 pb-2 mb-2 flex justify-between items-end">
                        <h3 className="font-bold text-teal-700 dark:text-teal-500">1. ข้อมูลผู้จำหน่าย (Vendor Info)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ผู้จำหน่าย (Vendor Name)</label>
                        <input type="text" value={customData.po_vendorName || ''} onChange={e => setCustomData({...customData, po_vendorName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" placeholder="ชื่อบริษัทผู้ขาย / ซัพพลายเออร์..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ผู้จำหน่าย (Vendor Address)</label>
                        <textarea rows={2} value={customData.po_vendorAddress || ''} onChange={e => setCustomData({...customData, po_vendorAddress: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" placeholder="ที่อยู่สำหรับติดต่อ / ออกใบกำกับภาษี..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                        <input type="text" value={customData.po_vendorTaxId || ''} onChange={e => setCustomData({...customData, po_vendorTaxId: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก..." />
                      </div>

                      <div className="md:col-span-2 border-b border-teal-100 dark:border-teal-800/50 pb-2 mb-2 mt-4">
                        <h3 className="font-bold text-teal-700 dark:text-teal-500">2. ข้อมูลเอกสารและผู้ติดต่อ</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขที่ใบสั่งซื้อ (PO No.)</label>
                        <input type="text" value={customData.po_refNo || ''} onChange={e => setCustomData({...customData, po_refNo: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" placeholder="เช่น PO2024030001..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ (Date)</label>
                        <input type="date" value={customData.po_date || formData.date} onChange={e => { setCustomData({...customData, po_date: e.target.value}); setFormData({...formData, date: e.target.value}); }} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ครบกำหนด (Due Date)</label>
                        <input type="date" value={customData.po_dueDate || formData.dueDate} onChange={e => { setCustomData({...customData, po_dueDate: e.target.value}); setFormData({...formData, dueDate: e.target.value}); }} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ผู้สั่งซื้อ (Buyer)</label>
                        <input type="text" value={customData.po_buyer || ''} onChange={e => setCustomData({...customData, po_buyer: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" placeholder="ชื่อผู้สั่งซื้อ..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่องาน (Project Name)</label>
                        <input type="text" value={customData.po_projectName || ''} onChange={e => setCustomData({...customData, po_projectName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" placeholder="ระบุชื่องาน..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ผู้ติดต่อ (Contact Person)</label>
                        <input type="text" value={customData.po_contactName || ''} onChange={e => setCustomData({...customData, po_contactName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" placeholder="ชื่อผู้ติดต่อ..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เบอร์โทร (Phone)</label>
                        <input type="text" value={customData.po_contactPhone || ''} onChange={e => setCustomData({...customData, po_contactPhone: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" placeholder="เบอร์โทรติดต่อ..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">อีเมล (Email)</label>
                        <input type="email" value={customData.po_contactEmail || ''} onChange={e => setCustomData({...customData, po_contactEmail: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-700" placeholder="อีเมล..." />
                      </div>
                    </div>

                    {/* รายการสินค้าและราคารวม */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-teal-100 dark:border-teal-800/50">
                      <div className="border-b border-teal-100 dark:border-teal-800/50 pb-2 mb-2 flex justify-between items-center">
                        <h3 className="font-bold text-teal-700 dark:text-teal-500">3. รายการสั่งซื้อ (Order Items)</h3>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <input type="radio" name="po_priceType" checked={formData.priceType === 'exclude_vat'} onChange={() => setFormData({...formData, priceType: 'exclude_vat'})} className="accent-teal-600" /> ราคาแยกภาษี
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <input type="radio" name="po_priceType" checked={formData.priceType === 'include_vat'} onChange={() => setFormData({...formData, priceType: 'include_vat'})} className="accent-teal-600" /> ราคารวมภาษี
                          </label>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400">
                              <th className="py-2 px-2 w-10 text-center">#</th>
                              <th className="py-2 px-2">รายละเอียด</th>
                              <th className="py-2 px-2 w-24 text-right">จำนวน</th>
                              <th className="py-2 px-2 w-24">หน่วย</th>
                              <th className="py-2 px-2 w-32 text-right">ราคาต่อหน่วย</th>
                              <th className="py-2 px-2 w-32 text-right">มูลค่า</th>
                              <th className="py-2 px-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.items.map((item: any, index: number) => {
                              const itemAmount = (Number(item.qty) * Number(item.unitPrice));
                              return (
                              <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-2 px-2 text-center text-gray-500">{index + 1}</td>
                                <td className="py-2 px-2">
                                  <input type="text" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-teal-500 rounded bg-transparent outline-none dark:text-white" placeholder="ชื่อสินค้า..." />
                                </td>
                                <td className="py-2 px-2">
                                  <input type="number" min="0" value={item.qty} onChange={e => handleItemChange(index, 'qty', Number(e.target.value))} className="w-full p-1.5 text-right border border-transparent hover:border-gray-300 focus:border-teal-500 rounded bg-transparent outline-none dark:text-white" />
                                </td>
                                <td className="py-2 px-2">
                                  <input type="text" value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-teal-500 rounded bg-transparent outline-none dark:text-white" />
                                </td>
                                <td className="py-2 px-2">
                                  <input type="number" min="0" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))} className="w-full p-1.5 text-right border border-transparent hover:border-gray-300 focus:border-teal-500 rounded bg-transparent outline-none dark:text-white" />
                                </td>
                                <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-300 font-medium">
                                  {itemAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <button type="button" onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            )})}
                          </tbody>
                        </table>
                        <div className="mt-3">
                          <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400">
                            <Plus className="w-4 h-4" /> เพิ่มรายการ
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 mt-2">
                        <div>
                          {/* Empty space for layout balance, or can put remarks here */}
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">รวมเป็นเงิน</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium cursor-pointer">
                                <input type="checkbox" checked={formData.discountPercent > 0} onChange={e => setFormData({...formData, discountPercent: e.target.checked ? 10 : 0})} className="w-3.5 h-3.5 accent-teal-600"/>
                                ส่วนลด
                              </label>
                              {formData.discountPercent > 0 && (
                                <div className="flex items-center gap-1 border-b border-gray-300 dark:border-gray-600">
                                  <input type="number" value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: Number(e.target.value)})} className="w-10 text-center bg-transparent outline-none text-gray-700 dark:text-gray-300" />
                                  <span className="text-gray-500">%</span>
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {formData.discountPercent > 0 ? '-' : ''}{discountAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">ราคาหลังหักส่วนลด</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{afterDiscount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <label className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium cursor-pointer">
                              <input type="checkbox" checked={formData.hasVat} onChange={e => setFormData({...formData, hasVat: e.target.checked})} className="w-3.5 h-3.5 accent-teal-600"/>
                              ภาษีมูลค่าเพิ่ม 7%
                            </label>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{vatAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                          </div>
                          
                          {formData.hasVat && formData.priceType === 'include_vat' && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">ราคาไม่รวมภาษีมูลค่าเพิ่ม</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200">{(afterDiscount - vatAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-base pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-teal-700 dark:text-teal-500 font-bold">จำนวนเงินรวมทั้งสิ้น</span>
                            <span className="font-bold text-gray-900 dark:text-white text-lg">{grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-gray-800" placeholder="เช่น ส่งสินค้าที่ชั้น 12..." />
                </div>
              </div>
            )
          }

          if (isInvoice) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบวางบิล / ใบแจ้งหนี้ (Invoice / Billing Note)</h2>
                    <p className="text-gray-500 mt-2">แบบฟอร์มบันทึกข้อมูลใบแจ้งหนี้เพื่อส่งให้ลูกค้า</p>
                  </div>
                  
                  <div className="space-y-8 max-w-4xl mx-auto">
                    {/* ข้อมูลลูกค้า และ ข้อมูลเอกสาร */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/50">
                      
                      <div className="md:col-span-2 border-b border-purple-100 dark:border-purple-800/50 pb-2 mb-2 flex justify-between items-end">
                        <h3 className="font-bold text-purple-700 dark:text-purple-500">1. ข้อมูลลูกค้า (Customer Info)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ลูกค้า (Customer Name)</label>
                        <input type="text" value={customData.inv_customerName || ''} onChange={e => setCustomData({...customData, inv_customerName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="ชื่อบริษัทลูกค้า..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ลูกค้า (Customer Address)</label>
                        <textarea rows={2} value={customData.inv_customerAddress || ''} onChange={e => setCustomData({...customData, inv_customerAddress: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="ที่อยู่สำหรับติดต่อ / ออกใบแจ้งหนี้..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                        <input type="text" value={customData.inv_customerTaxId || ''} onChange={e => setCustomData({...customData, inv_customerTaxId: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก..." />
                      </div>

                      <div className="md:col-span-2 border-b border-purple-100 dark:border-purple-800/50 pb-2 mb-2 mt-4">
                        <h3 className="font-bold text-purple-700 dark:text-purple-500">2. ข้อมูลเอกสารและผู้ติดต่อ</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขที่ใบแจ้งหนี้ (Invoice No.)</label>
                        <input type="text" value={customData.inv_refNo || ''} onChange={e => setCustomData({...customData, inv_refNo: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="เช่น INV2024030001..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ (Date)</label>
                        <input type="date" value={customData.inv_date || formData.date} onChange={e => { setCustomData({...customData, inv_date: e.target.value}); setFormData({...formData, date: e.target.value}); }} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ครบกำหนด (Due Date)</label>
                        <input type="date" value={customData.inv_dueDate || formData.dueDate} onChange={e => { setCustomData({...customData, inv_dueDate: e.target.value}); setFormData({...formData, dueDate: e.target.value}); }} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ผู้ขาย (Seller)</label>
                        <input type="text" value={customData.inv_seller || ''} onChange={e => setCustomData({...customData, inv_seller: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="ชื่อผู้ขาย..." />
                      </div>
                    </div>

                    {/* รายการสินค้าและราคารวม */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/50">
                      <div className="border-b border-purple-100 dark:border-purple-800/50 pb-2 mb-2 flex justify-between items-center">
                        <h3 className="font-bold text-purple-700 dark:text-purple-500">3. รายการสินค้า (Items)</h3>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <input type="radio" name="inv_priceType" checked={formData.priceType === 'exclude_vat'} onChange={() => setFormData({...formData, priceType: 'exclude_vat'})} className="accent-purple-600" /> ราคาแยกภาษี
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <input type="radio" name="inv_priceType" checked={formData.priceType === 'include_vat'} onChange={() => setFormData({...formData, priceType: 'include_vat'})} className="accent-purple-600" /> ราคารวมภาษี
                          </label>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400">
                              <th className="py-2 px-2 w-10 text-center">#</th>
                              <th className="py-2 px-2">รายละเอียด</th>
                              <th className="py-2 px-2 w-24 text-right">จำนวน</th>
                              <th className="py-2 px-2 w-24">หน่วย</th>
                              <th className="py-2 px-2 w-32 text-right">ราคาต่อหน่วย</th>
                              <th className="py-2 px-2 w-32 text-right">มูลค่า</th>
                              <th className="py-2 px-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.items.map((item: any, index: number) => {
                              const itemAmount = (Number(item.qty) * Number(item.unitPrice));
                              return (
                              <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-2 px-2 text-center text-gray-500">{index + 1}</td>
                                <td className="py-2 px-2">
                                  <input type="text" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-purple-500 rounded bg-transparent outline-none dark:text-white" placeholder="ชื่อสินค้า..." />
                                </td>
                                <td className="py-2 px-2">
                                  <input type="number" min="0" value={item.qty} onChange={e => handleItemChange(index, 'qty', Number(e.target.value))} className="w-full p-1.5 text-right border border-transparent hover:border-gray-300 focus:border-purple-500 rounded bg-transparent outline-none dark:text-white" />
                                </td>
                                <td className="py-2 px-2">
                                  <input type="text" value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-purple-500 rounded bg-transparent outline-none dark:text-white" />
                                </td>
                                <td className="py-2 px-2">
                                  <input type="number" min="0" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))} className="w-full p-1.5 text-right border border-transparent hover:border-gray-300 focus:border-purple-500 rounded bg-transparent outline-none dark:text-white" />
                                </td>
                                <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-300 font-medium">
                                  {itemAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <button type="button" onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            )})}
                          </tbody>
                        </table>
                        <div className="mt-3">
                          <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400">
                            <Plus className="w-4 h-4" /> เพิ่มรายการ
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 mt-2">
                        <div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">รวมเป็นเงิน</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium cursor-pointer">
                                <input type="checkbox" checked={formData.discountPercent > 0} onChange={e => setFormData({...formData, discountPercent: e.target.checked ? 10 : 0})} className="w-3.5 h-3.5 accent-purple-600"/>
                                ส่วนลด
                              </label>
                              {formData.discountPercent > 0 && (
                                <div className="flex items-center gap-1 border-b border-gray-300 dark:border-gray-600">
                                  <input type="number" value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: Number(e.target.value)})} className="w-10 text-center bg-transparent outline-none text-gray-700 dark:text-gray-300" />
                                  <span className="text-gray-500">%</span>
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {formData.discountPercent > 0 ? '-' : ''}{discountAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">ราคาหลังหักส่วนลด</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{afterDiscount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <label className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium cursor-pointer">
                              <input type="checkbox" checked={formData.hasVat} onChange={e => setFormData({...formData, hasVat: e.target.checked})} className="w-3.5 h-3.5 accent-purple-600"/>
                              ภาษีมูลค่าเพิ่ม 7%
                            </label>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{vatAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                          </div>
                          
                          {formData.hasVat && formData.priceType === 'include_vat' && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">ราคาไม่รวมภาษีมูลค่าเพิ่ม</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200">{(afterDiscount - vatAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-base pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-purple-700 dark:text-purple-500 font-bold">จำนวนเงินรวมทั้งสิ้น</span>
                            <span className="font-bold text-gray-900 dark:text-white text-lg">{grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-800" placeholder="เช่น บัญชีธนาคาร 1234567890..." />
                </div>
              </div>
            )
          }

          if (isWithholdingTax) {
            const whtItems = customData.wht_items || [{ name: '', date: '', amount: 0, tax: 0 }]
            const handleWhtItemChange = (idx: number, field: string, value: any) => {
              const newItems = [...whtItems]
              newItems[idx] = { ...newItems[idx], [field]: value }
              setCustomData({ ...customData, wht_items: newItems })
            }
            const addWhtItem = () => {
              setCustomData({ ...customData, wht_items: [...whtItems, { name: '', date: '', amount: 0, tax: 0 }] })
            }
            const removeWhtItem = (idx: number) => {
              setCustomData({ ...customData, wht_items: whtItems.filter((_: any, i: number) => i !== idx) })
            }
            
            const totalAmount = whtItems.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0)
            const totalTax = whtItems.reduce((acc: number, item: any) => acc + (Number(item.tax) || 0), 0)

            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-sky-50 dark:bg-sky-900/10 p-6 rounded-xl border border-sky-100 dark:border-sky-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)</h2>
                    <p className="text-gray-500 mt-2">แบบฟอร์มสำหรับการออกหนังสือรับรองการหักภาษี ณ ที่จ่าย</p>
                  </div>
                  
                  <div className="space-y-8 max-w-4xl mx-auto">
                    {/* ประเภทแบบยื่น */}
                    <div className="p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      <h3 className="font-bold text-sky-700 dark:text-sky-500 mb-4 border-b border-sky-100 pb-2">แบบยื่นภาษี</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['ภ.ง.ด.1ก', 'ภ.ง.ด.1ก พิเศษ', 'ภ.ง.ด.2', 'ภ.ง.ด.3', 'ภ.ง.ด.2ก', 'ภ.ง.ด.3ก', 'ภ.ง.ด.53'].map(type => (
                          <label key={type} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input type="radio" name="wht_formType" checked={customData.wht_formType === type || (!customData.wht_formType && type === 'ภ.ง.ด.53')} onChange={() => setCustomData({...customData, wht_formType: type})} className="accent-sky-600" />
                            {type}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      {/* ข้อมูลผู้มีหน้าที่หักภาษี ณ ที่จ่าย */}
                      <div className="md:col-span-2 border-b border-sky-100 dark:border-sky-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-sky-700 dark:text-sky-500">1. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย (Payer)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อผู้มีหน้าที่หักภาษี</label>
                        <input type="text" value={customData.wht_payerName !== undefined ? customData.wht_payerName : (company?.name || '')} onChange={e => setCustomData({...customData, wht_payerName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="ชื่อบริษัท..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่</label>
                        <textarea rows={2} value={customData.wht_payerAddress !== undefined ? customData.wht_payerAddress : (company?.address || '')} onChange={e => setCustomData({...customData, wht_payerAddress: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="ที่อยู่บริษัท..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
                        <input type="text" value={customData.wht_payerTaxId !== undefined ? customData.wht_payerTaxId : (company?.taxId || '')} onChange={e => setCustomData({...customData, wht_payerTaxId: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก..." />
                      </div>

                      {/* ข้อมูลผู้ถูกหักภาษี ณ ที่จ่าย */}
                      <div className="md:col-span-2 border-b border-sky-100 dark:border-sky-800/50 pb-2 mb-2 mt-4">
                        <h3 className="font-bold text-sky-700 dark:text-sky-500">2. ผู้ถูกหักภาษี ณ ที่จ่าย (Payee)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อผู้ถูกหักภาษี (บุคคล/นิติบุคคล)</label>
                        <input type="text" value={customData.wht_payeeName || ''} onChange={e => setCustomData({...customData, wht_payeeName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="ชื่อผู้รับเงิน..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่</label>
                        <textarea rows={2} value={customData.wht_payeeAddress || ''} onChange={e => setCustomData({...customData, wht_payeeAddress: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="ที่อยู่ผู้รับเงิน..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
                        <input type="text" value={customData.wht_payeeTaxId || ''} onChange={e => setCustomData({...customData, wht_payeeTaxId: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก..." />
                      </div>
                    </div>

                    {/* ตารางรายการเงินได้ */}
                    <div className="p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      <div className="border-b border-sky-100 dark:border-sky-800/50 pb-2 mb-4 flex justify-between items-center">
                        <h3 className="font-bold text-sky-700 dark:text-sky-500">3. ประเภทเงินได้พึงประเมินที่จ่าย</h3>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400">
                              <th className="py-2 px-2 w-10 text-center">#</th>
                              <th className="py-2 px-2">ประเภทเงินได้ / คำอธิบาย</th>
                              <th className="py-2 px-2 w-32">วัน/เดือน/ปี ที่จ่าย</th>
                              <th className="py-2 px-2 w-32 text-right">จำนวนเงินที่จ่าย</th>
                              <th className="py-2 px-2 w-32 text-right">ภาษีที่หักและนำส่งไว้</th>
                              <th className="py-2 px-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {whtItems.map((item: any, index: number) => (
                              <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-2 px-2 text-center text-gray-500">{index + 1}</td>
                                <td className="py-2 px-2">
                                  <input type="text" value={item.name} onChange={e => handleWhtItemChange(index, 'name', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-sky-500 rounded bg-transparent outline-none dark:text-white" placeholder="เช่น ค่าบริการ, ค่าขนส่ง..." />
                                </td>
                                <td className="py-2 px-2">
                                  <input type="text" value={item.date} onChange={e => handleWhtItemChange(index, 'date', e.target.value)} className="w-full p-1.5 border border-transparent hover:border-gray-300 focus:border-sky-500 rounded bg-transparent outline-none dark:text-white text-sm" placeholder="DD/MM/YYYY" />
                                </td>
                                <td className="py-2 px-2">
                                  <input type="number" min="0" value={item.amount || ''} onChange={e => handleWhtItemChange(index, 'amount', Number(e.target.value))} className="w-full p-1.5 text-right border border-transparent hover:border-gray-300 focus:border-sky-500 rounded bg-transparent outline-none dark:text-white" placeholder="0.00" />
                                </td>
                                <td className="py-2 px-2">
                                  <input type="number" min="0" value={item.tax || ''} onChange={e => handleWhtItemChange(index, 'tax', Number(e.target.value))} className="w-full p-1.5 text-right border border-transparent hover:border-gray-300 focus:border-sky-500 rounded bg-transparent outline-none dark:text-white" placeholder="0.00" />
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <button type="button" onClick={() => removeWhtItem(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-3">
                          <button type="button" onClick={addWhtItem} className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400">
                            <Plus className="w-4 h-4" /> เพิ่มรายการเงินได้
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 mt-2">
                        <div></div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm font-bold border-t border-gray-200 dark:border-gray-700 pt-3">
                            <span className="text-gray-800 dark:text-gray-200">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</span>
                            <div className="flex gap-4">
                              <span className="w-32 text-right">{totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              <span className="w-32 text-right">{totalTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              <span className="w-10"></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ออกหนังสือรับรองฯ (Date)</label>
                        <input type="date" value={customData.wht_date || formData.date} onChange={e => { setCustomData({...customData, wht_date: e.target.value}); setFormData({...formData, date: e.target.value}); }} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          if (isBizReg) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบทะเบียนพาณิชย์ / ทะเบียนการค้า (Business Registration Certificate)</h2>
                    <p className="text-gray-500 mt-2">แบบฟอร์มบันทึกข้อมูลใบทะเบียนพาณิชย์สำหรับร้านค้าหรือธุรกิจ</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลการจดทะเบียน */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                      <div className="md:col-span-2 border-b border-indigo-100 dark:border-indigo-800/50 pb-2 mb-2 flex justify-between items-end">
                        <h3 className="font-bold text-indigo-700 dark:text-indigo-500">1. ข้อมูลการจดทะเบียน (Registration Details)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อที่ใช้ในการประกอบพาณิชยกิจ (Business Name)</label>
                        <input type="text" value={customData.bizReg_companyName || ''} onChange={e => setCustomData({...customData, bizReg_companyName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700 font-medium text-indigo-900 dark:text-indigo-100" placeholder="ระบุชื่อร้าน หรือชื่อธุรกิจ..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขทะเบียนพาณิชย์ (Registration No.)</label>
                        <input type="text" value={customData.bizReg_registrationNo || ''} onChange={e => setCustomData({...customData, bizReg_registrationNo: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="เลขที่จดทะเบียน..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่จดทะเบียน (Date of Registration)</label>
                        <input type="date" value={customData.bizReg_registrationDate || ''} onChange={e => setCustomData({...customData, bizReg_registrationDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อผู้ประกอบพาณิชยกิจ (Owner Name)</label>
                        <input type="text" value={customData.bizReg_ownerName || ''} onChange={e => setCustomData({...customData, bizReg_ownerName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="ชื่อ-นามสกุล เจ้าของกิจการ..." />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชนิดพาณิชยกิจ (Business Activities / Type)</label>
                        <textarea rows={2} value={customData.bizReg_bizType || ''} onChange={e => setCustomData({...customData, bizReg_bizType: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="เช่น การขายปลีกเสื้อผ้า, การบริการทำความสะอาด..." />
                      </div>
                    </div>

                    {/* ที่ตั้งและสำนักงาน */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                      <div className="border-b border-indigo-100 dark:border-indigo-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-indigo-700 dark:text-indigo-500">2. ที่ตั้งสำนักงาน (Office Address)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สำนักงานตั้งอยู่เลขที่ (Address)</label>
                        <textarea rows={3} value={customData.bizReg_address || ''} onChange={e => setCustomData({...customData, bizReg_address: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700 leading-relaxed" placeholder="ที่อยู่ครบถ้วนตามที่ได้จดทะเบียนไว้..." />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">นายทะเบียน (Registrar - ถ้ามี)</label>
                          <input type="text" value={customData.bizReg_registrar || ''} onChange={e => setCustomData({...customData, bizReg_registrar: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="ชื่อหรือตำแหน่งนายทะเบียนผู้ออกใบรับรอง..." />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-indigo-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isPaymentVoucher) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-xl border border-rose-100 dark:border-rose-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบสำคัญจ่าย (Payment Voucher - PV)</h2>
                    <p className="text-gray-500 mt-2">เอกสารหลักฐานประกอบการจ่ายเงินของบริษัท</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลผู้รับเงินและเอกสาร */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-rose-100 dark:border-rose-800/50">
                      <div className="md:col-span-2 border-b border-rose-100 dark:border-rose-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-rose-700 dark:text-rose-500">1. ข้อมูลการจ่ายเงิน (Payment Details)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">จ่ายให้ (Payee Name)</label>
                        <input type="text" value={customData.pv_payeeName || ''} onChange={e => setCustomData({...customData, pv_payeeName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" placeholder="ชื่อบุคคล หรือ นิติบุคคลที่รับเงิน..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ (Address)</label>
                        <textarea rows={2} value={customData.pv_payeeAddress || ''} onChange={e => setCustomData({...customData, pv_payeeAddress: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" placeholder="ที่อยู่ผู้รับเงิน..." />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ (Date)</label>
                        <input type="date" value={customData.pv_date || ''} onChange={e => setCustomData({...customData, pv_date: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขที่ใบสำคัญ (Voucher No.)</label>
                        <input type="text" value={customData.pv_refNo || ''} onChange={e => setCustomData({...customData, pv_refNo: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" placeholder="เช่น PV-20231001..." />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชำระโดย (Paid By)</label>
                        <select value={customData.pv_paymentMethod || ''} onChange={e => setCustomData({...customData, pv_paymentMethod: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700">
                          <option value="">-- เลือกวิธีการชำระ --</option>
                          <option value="เงินสด (Cash)">เงินสด (Cash)</option>
                          <option value="เงินโอน (Bank Transfer)">เงินโอน (Bank Transfer)</option>
                          <option value="เช็ค (Cheque)">เช็ค (Cheque)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ข้อมูลอ้างอิงการจ่าย (Bank / Cheque Ref)</label>
                        <input type="text" value={customData.pv_bankRef || ''} onChange={e => setCustomData({...customData, pv_bankRef: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" placeholder="เช่น เช็คธนาคาร... เลขที่... ลงวันที่..." />
                      </div>
                    </div>

                    {/* รายการชำระเงินและภาษี */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-rose-100 dark:border-rose-800/50">
                      <div className="border-b border-rose-100 dark:border-rose-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-rose-700 dark:text-rose-500">2. รายการชำระเงิน (Payment Items & Tax)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รายละเอียดรายการชำระ (Payment Description)</label>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                          รูปแบบแนะนำ: ลำดับ | รายการ/คำอธิบาย | จำนวนเงิน<br/>
                          เช่น: 1 | ค่าจ้างทำความสะอาดสำนักงานประจำเดือน | 5,000
                        </div>
                        <textarea rows={5} value={customData.pv_itemsText || ''} onChange={e => setCustomData({...customData, pv_itemsText: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700 font-mono text-sm leading-relaxed" placeholder="1. ...\n2. ..." />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">จำนวนเงิน (Amount)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.pv_subTotal || ''} onChange={e => setCustomData({...customData, pv_subTotal: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" placeholder="0.00" />
                            <span className="text-gray-600 dark:text-gray-400">บาท</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หักภาษี ณ ที่จ่าย (WHT - ถ้ามี)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.pv_taxAmount || ''} onChange={e => setCustomData({...customData, pv_taxAmount: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 dark:bg-gray-700" placeholder="0.00" />
                            <span className="text-gray-600 dark:text-gray-400">บาท</span>
                          </div>
                        </div>
                        <div className="md:col-span-2 lg:col-span-1">
                          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">ยอดสุทธิ (Net Amount)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.pv_grandTotal || ''} onChange={e => setCustomData({...customData, pv_grandTotal: e.target.value})} className="w-full p-2.5 border-2 border-rose-300 dark:border-rose-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 bg-rose-50 dark:bg-rose-900/30 text-lg font-bold text-rose-900 dark:text-rose-300" placeholder="0.00" />
                            <span className="font-bold text-gray-900 dark:text-white">บาท</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-rose-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isReceiptVoucher) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-lime-50 dark:bg-lime-900/10 p-6 rounded-xl border border-lime-100 dark:border-lime-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบสำคัญรับ (Receipt Voucher - RV)</h2>
                    <p className="text-gray-500 mt-2">เอกสารหลักฐานประกอบการรับเงินของบริษัท</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลผู้จ่ายเงินและเอกสาร */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-lime-100 dark:border-lime-800/50">
                      <div className="md:col-span-2 border-b border-lime-100 dark:border-lime-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-lime-700 dark:text-lime-500">1. ข้อมูลการรับเงิน (Receipt Details)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รับเงินจาก (Received From)</label>
                        <input type="text" value={customData.rv_payerName || ''} onChange={e => setCustomData({...customData, rv_payerName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-lime-500/50 dark:bg-gray-700" placeholder="ชื่อบุคคล หรือ นิติบุคคลที่จ่ายเงิน..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ (Address)</label>
                        <textarea rows={2} value={customData.rv_payerAddress || ''} onChange={e => setCustomData({...customData, rv_payerAddress: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-lime-500/50 dark:bg-gray-700" placeholder="ที่อยู่ผู้จ่ายเงิน..." />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ (Date)</label>
                        <input type="date" value={customData.rv_date || ''} onChange={e => setCustomData({...customData, rv_date: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-lime-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขที่ใบสำคัญ (Voucher No.)</label>
                        <input type="text" value={customData.rv_refNo || ''} onChange={e => setCustomData({...customData, rv_refNo: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-lime-500/50 dark:bg-gray-700" placeholder="เช่น RV-20231001..." />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รับชำระโดย (Received By)</label>
                        <select value={customData.rv_paymentMethod || ''} onChange={e => setCustomData({...customData, rv_paymentMethod: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-lime-500/50 dark:bg-gray-700">
                          <option value="">-- เลือกวิธีการรับชำระ --</option>
                          <option value="เงินสด (Cash)">เงินสด (Cash)</option>
                          <option value="เงินโอน (Bank Transfer)">เงินโอน (Bank Transfer)</option>
                          <option value="เช็ค (Cheque)">เช็ค (Cheque)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ข้อมูลอ้างอิง (Bank / Cheque Ref)</label>
                        <input type="text" value={customData.rv_bankRef || ''} onChange={e => setCustomData({...customData, rv_bankRef: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-lime-500/50 dark:bg-gray-700" placeholder="เช่น เช็คธนาคาร... เลขที่... ลงวันที่..." />
                      </div>
                    </div>

                    {/* รายการรับเงินและภาษี */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-lime-100 dark:border-lime-800/50">
                      <div className="border-b border-lime-100 dark:border-lime-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-lime-700 dark:text-lime-500">2. รายการรับเงิน (Receipt Items & Tax)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รายละเอียดรายการรับเงิน (Receipt Description)</label>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                          รูปแบบแนะนำ: ลำดับ | รายการ/คำอธิบาย | จำนวนเงิน<br/>
                          เช่น: 1 | ชำระค่าบริการตามใบแจ้งหนี้ INV-20231005 | 15,000
                        </div>
                        <textarea rows={5} value={customData.rv_itemsText || ''} onChange={e => setCustomData({...customData, rv_itemsText: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-lime-500/50 dark:bg-gray-700 font-mono text-sm leading-relaxed" placeholder="1. ...\n2. ..." />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">จำนวนเงิน (Amount)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.rv_subTotal || ''} onChange={e => setCustomData({...customData, rv_subTotal: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-lime-500/50 dark:bg-gray-700" placeholder="0.00" />
                            <span className="text-gray-600 dark:text-gray-400">บาท</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ถูกหักภาษี ณ ที่จ่าย (WHT - ถ้ามี)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.rv_taxAmount || ''} onChange={e => setCustomData({...customData, rv_taxAmount: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-lime-500/50 dark:bg-gray-700" placeholder="0.00" />
                            <span className="text-gray-600 dark:text-gray-400">บาท</span>
                          </div>
                        </div>
                        <div className="md:col-span-2 lg:col-span-1">
                          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">ยอดสุทธิ (Net Amount)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.rv_grandTotal || ''} onChange={e => setCustomData({...customData, rv_grandTotal: e.target.value})} className="w-full p-2.5 border-2 border-lime-300 dark:border-lime-600 rounded-md outline-none focus:ring-2 focus:ring-lime-500/50 bg-lime-50 dark:bg-lime-900/30 text-lg font-bold text-lime-900 dark:text-lime-300" placeholder="0.00" />
                            <span className="font-bold text-gray-900 dark:text-white">บาท</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-lime-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isJournal) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-100 dark:border-amber-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">สมุดรายวันและบัญชีแยกประเภท (Journal & General Ledger)</h2>
                    <p className="text-gray-500 mt-2">แบบฟอร์มสำหรับบันทึกรายการบัญชีประจำวันและการจัดทำบัญชีแยกประเภท</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลสมุดบัญชี */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-800/50">
                      <div className="md:col-span-2 border-b border-amber-100 dark:border-amber-800/50 pb-2 mb-2 flex justify-between items-end">
                        <h3 className="font-bold text-amber-700 dark:text-amber-500">1. ข้อมูลสมุดบัญชี (Journal Book Info)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประเภทสมุดบัญชี (Journal Type)</label>
                        <select value={customData.gl_bookType || ''} onChange={e => setCustomData({...customData, gl_bookType: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700">
                          <option value="">-- เลือกประเภทสมุดรายวัน --</option>
                          <option value="สมุดรายวันทั่วไป (General Journal)">สมุดรายวันทั่วไป (General Journal)</option>
                          <option value="สมุดรายวันรับเงิน (Cash Receipt Journal)">สมุดรายวันรับเงิน (Cash Receipt Journal)</option>
                          <option value="สมุดรายวันจ่ายเงิน (Cash Payment Journal)">สมุดรายวันจ่ายเงิน (Cash Payment Journal)</option>
                          <option value="สมุดรายวันซื้อ (Purchases Journal)">สมุดรายวันซื้อ (Purchases Journal)</option>
                          <option value="สมุดรายวันขาย (Sales Journal)">สมุดรายวันขาย (Sales Journal)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่บันทึก (Date)</label>
                        <input type="date" value={customData.gl_date || ''} onChange={e => setCustomData({...customData, gl_date: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขที่เอกสารอ้างอิง (Ref. No. / Voucher No.)</label>
                        <input type="text" value={customData.gl_refNo || ''} onChange={e => setCustomData({...customData, gl_refNo: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="เช่น JV-202310001..." />
                      </div>
                    </div>

                    {/* รายการบันทึกบัญชี */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-800/50">
                      <div className="border-b border-amber-100 dark:border-amber-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-amber-700 dark:text-amber-500">2. รายการบันทึกบัญชี (Journal Entries)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รายละเอียดการบันทึกบัญชี (Entries Detail)</label>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                          รูปแบบแนะนำ: รหัสบัญชี | ชื่อบัญชี | คำอธิบายรายการ | เดบิต (Debit) | เครดิต (Credit)<br/>
                          เช่น:<br/>
                          1101 | เงินสด | รับชำระหนี้จากลูกค้า | 10,000 | 0<br/>
                          1201 | ลูกหนี้การค้า | รับชำระหนี้จากลูกค้า | 0 | 10,000
                        </div>
                        <textarea rows={8} value={customData.gl_entriesText || ''} onChange={e => setCustomData({...customData, gl_entriesText: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700 font-mono text-sm leading-relaxed" placeholder="1101 | เงินสด | รับรายได้ | 5000 | 0&#10;4101 | รายได้ค่าบริการ | รับรายได้ | 0 | 5000" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รวมเดบิต (Total Debit)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.gl_debit || ''} onChange={e => setCustomData({...customData, gl_debit: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="0.00" />
                            <span className="text-gray-600 dark:text-gray-400">บาท</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รวมเครดิต (Total Credit)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={customData.gl_credit || ''} onChange={e => setCustomData({...customData, gl_credit: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-500/50 dark:bg-gray-700" placeholder="0.00" />
                            <span className="text-gray-600 dark:text-gray-400">บาท</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ / คำอธิบายเพิ่มเติม (Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-amber-500/50 dark:bg-gray-800" />
                </div>
              </div>
            )
          }

          if (isBankStatement) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-sky-50 dark:bg-sky-900/10 p-6 rounded-xl border border-sky-100 dark:border-sky-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">รายงาน Statement จากธนาคาร (Bank Statement Report)</h2>
                    <p className="text-gray-500 mt-2">แบบฟอร์มสำหรับสรุปและนำส่งข้อมูลรายการเดินบัญชีธนาคาร</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลบัญชีธนาคาร */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      <div className="md:col-span-2 border-b border-sky-100 dark:border-sky-800/50 pb-2 mb-2 flex justify-between items-end">
                        <h3 className="font-bold text-sky-700 dark:text-sky-500">1. ข้อมูลบัญชีธนาคาร (Bank Account Info)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อธนาคาร (Bank Name)</label>
                        <select value={customData.stmt_bankName || ''} onChange={e => setCustomData({...customData, stmt_bankName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700 font-medium">
                          <option value="">-- เลือกธนาคาร --</option>
                          <option value="กสิกรไทย (KBANK)">กสิกรไทย (KBANK)</option>
                          <option value="ไทยพาณิชย์ (SCB)">ไทยพาณิชย์ (SCB)</option>
                          <option value="กรุงเทพ (BBL)">กรุงเทพ (BBL)</option>
                          <option value="กรุงไทย (KTB)">กรุงไทย (KTB)</option>
                          <option value="กรุงศรีอยุธยา (BAY)">กรุงศรีอยุธยา (BAY)</option>
                          <option value="ทหารไทยธนชาต (TTB)">ทหารไทยธนชาต (TTB)</option>
                          <option value="อื่นๆ (Other)">อื่นๆ (Other)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อบัญชี (Account Name)</label>
                        <input type="text" value={customData.stmt_accountName || ''} onChange={e => setCustomData({...customData, stmt_accountName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="ชื่อบัญชีบริษัท..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขที่บัญชี (Account No.)</label>
                        <input type="text" value={customData.stmt_accountNo || ''} onChange={e => setCustomData({...customData, stmt_accountNo: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700 font-mono" placeholder="xxx-x-xxxxx-x" />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รอบระยะเวลา Statement (Statement Period)</label>
                        <input type="text" value={customData.stmt_period || ''} onChange={e => setCustomData({...customData, stmt_period: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="เช่น 1 ตุลาคม 2566 ถึง 31 ตุลาคม 2566..." />
                      </div>
                    </div>

                    {/* สรุปยอดเงิน */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      <div className="md:col-span-2 border-b border-sky-100 dark:border-sky-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-sky-700 dark:text-sky-500">2. สรุปยอดเงิน (Balance Summary)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ยอดยกมา (Beginning Balance)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={customData.stmt_beginningBalance || ''} onChange={e => setCustomData({...customData, stmt_beginningBalance: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700" placeholder="0.00" />
                          <span className="text-gray-600 dark:text-gray-400">บาท</span>
                        </div>
                      </div>
                      <div className="hidden md:block"></div>
                      
                      <div>
                        <label className="block text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1">รวมยอดเงินเข้า (Total Deposit)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.stmt_totalIn || ''} onChange={e => setCustomData({...customData, stmt_totalIn: e.target.value})} className="w-full p-2.5 border border-emerald-200 dark:border-emerald-700 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" placeholder="0.00" />
                          <span className="text-gray-600 dark:text-gray-400">บาท</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-rose-600 dark:text-rose-400 mb-1">รวมยอดเงินออก (Total Withdrawal)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.stmt_totalOut || ''} onChange={e => setCustomData({...customData, stmt_totalOut: e.target.value})} className="w-full p-2.5 border border-rose-200 dark:border-rose-700 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300" placeholder="0.00" />
                          <span className="text-gray-600 dark:text-gray-400">บาท</span>
                        </div>
                      </div>

                      <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">ยอดยกไป (Ending Balance)</label>
                        <div className="flex items-center gap-2 max-w-md">
                          <input type="number" value={customData.stmt_endingBalance || ''} onChange={e => setCustomData({...customData, stmt_endingBalance: e.target.value})} className="w-full p-2.5 border-2 border-sky-300 dark:border-sky-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 bg-sky-50 dark:bg-sky-900/30 text-lg font-bold text-sky-900 dark:text-sky-300" placeholder="0.00" />
                          <span className="font-bold text-gray-900 dark:text-white">บาท</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* รายละเอียดเพิ่มเติม */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-sky-100 dark:border-sky-800/50">
                      <div className="border-b border-sky-100 dark:border-sky-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-sky-700 dark:text-sky-500">3. รายละเอียดรายการ (Statement Entries - ทางเลือก)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">บันทึกรายการบัญชีที่น่าสนใจ หรือต้องตรวจสอบ (Notes on specific entries)</label>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                          รูปแบบแนะนำ: วันที่ | คำอธิบายรายการ | จำนวนเงินเข้า/ออก<br/>
                          เช่น: 15/10/66 | ค่าธรรมเนียมรักษาบัญชี | -50
                        </div>
                        <textarea rows={5} value={customData.stmt_entriesText || ''} onChange={e => setCustomData({...customData, stmt_entriesText: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 dark:bg-gray-700 font-mono text-sm leading-relaxed" placeholder="15/10/66 | ..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-sky-500/50 dark:bg-gray-800" placeholder="คำอธิบายเพิ่มเติมสำหรับการนำส่ง Statement..." />
                </div>
              </div>
            )
          }

          if (isFixedAsset) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ทะเบียนทรัพย์สิน (Fixed Asset Register)</h2>
                    <p className="text-gray-500 mt-2">แบบฟอร์มบันทึกรายละเอียดทรัพย์สินและข้อมูลค่าเสื่อมราคา</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลทรัพย์สิน */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/50">
                      <div className="md:col-span-2 border-b border-purple-100 dark:border-purple-800/50 pb-2 mb-2 flex justify-between items-end">
                        <h3 className="font-bold text-purple-700 dark:text-purple-500">1. ข้อมูลพื้นฐานทรัพย์สิน (Asset Basic Info)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รหัสทรัพย์สิน (Asset Code)</label>
                        <input type="text" value={customData.fa_assetCode || ''} onChange={e => setCustomData({...customData, fa_assetCode: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="เช่น FA-2023-001..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อทรัพย์สิน (Asset Name)</label>
                        <input type="text" value={customData.fa_assetName || ''} onChange={e => setCustomData({...customData, fa_assetName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700 font-medium" placeholder="เช่น เครื่องพิมพ์มัลติฟังก์ชั่น แบรนด์ ABC..." />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประเภททรัพย์สิน (Asset Category)</label>
                        <select value={customData.fa_assetType || ''} onChange={e => setCustomData({...customData, fa_assetType: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700">
                          <option value="">-- เลือกประเภททรัพย์สิน --</option>
                          <option value="อาคารและสิ่งปลูกสร้าง (Buildings)">อาคารและสิ่งปลูกสร้าง (Buildings)</option>
                          <option value="เครื่องจักรและอุปกรณ์ (Machinery & Equipment)">เครื่องจักรและอุปกรณ์ (Machinery & Equipment)</option>
                          <option value="เครื่องตกแต่งและติดตั้ง (Furniture & Fixtures)">เครื่องตกแต่งและติดตั้ง (Furniture & Fixtures)</option>
                          <option value="อุปกรณ์สำนักงาน (Office Equipment)">อุปกรณ์สำนักงาน (Office Equipment)</option>
                          <option value="ยานพาหนะ (Vehicles)">ยานพาหนะ (Vehicles)</option>
                          <option value="คอมพิวเตอร์และซอฟต์แวร์ (Computers & Software)">คอมพิวเตอร์และซอฟต์แวร์ (Computers & Software)</option>
                          <option value="อื่นๆ (Other)">อื่นๆ (Other)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ได้มา (Acquisition Date)</label>
                        <input type="date" value={customData.fa_acquisitionDate || ''} onChange={e => setCustomData({...customData, fa_acquisitionDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" />
                      </div>
                    </div>

                    {/* ข้อมูลมูลค่าและค่าเสื่อมราคา */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/50">
                      <div className="md:col-span-2 border-b border-purple-100 dark:border-purple-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-purple-700 dark:text-purple-500">2. ข้อมูลมูลค่าและค่าเสื่อมราคา (Value & Depreciation)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ราคาทุน / มูลค่าที่ได้มา (Cost)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.fa_cost || ''} onChange={e => setCustomData({...customData, fa_cost: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="0.00" />
                          <span className="text-gray-600 dark:text-gray-400">บาท</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ราคาซากโดยประมาณ (Salvage Value)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.fa_salvageValue || ''} onChange={e => setCustomData({...customData, fa_salvageValue: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="0.00 (หรือ 1 บาท)" />
                          <span className="text-gray-600 dark:text-gray-400">บาท</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">อายุการใช้งาน (Useful Life)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="1" value={customData.fa_usefulLife || ''} onChange={e => setCustomData({...customData, fa_usefulLife: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="เช่น 3 หรือ 5" />
                          <span className="text-gray-600 dark:text-gray-400">ปี</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วิธีคิดค่าเสื่อมราคา (Depreciation Method)</label>
                        <select value={customData.fa_depreciationMethod || ''} onChange={e => setCustomData({...customData, fa_depreciationMethod: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700">
                          <option value="">-- เลือกวิธีคิดค่าเสื่อม --</option>
                          <option value="วิธีเส้นตรง (Straight Line)">วิธีเส้นตรง (Straight Line)</option>
                          <option value="วิธียอดลดลงคู่ (Double Declining)">วิธียอดลดลงคู่ (Double Declining)</option>
                          <option value="วิธีผลรวมจำนวนปี (Sum-of-the-Years'-Digits)">วิธีผลรวมจำนวนปี (Sum-of-the-Years'-Digits)</option>
                          <option value="วิธีจำนวนผลผลิต (Units of Production)">วิธีจำนวนผลผลิต (Units of Production)</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* สถานะและสถานที่ตั้ง */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/50">
                      <div className="md:col-span-2 border-b border-purple-100 dark:border-purple-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-purple-700 dark:text-purple-500">3. การใช้งานและสถานะ (Location & Status)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สถานที่ตั้ง / แผนกที่ใช้งาน (Location/Department)</label>
                        <input type="text" value={customData.fa_location || ''} onChange={e => setCustomData({...customData, fa_location: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700" placeholder="เช่น แผนกบัญชี ชั้น 3..." />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สถานะทรัพย์สิน (Asset Status)</label>
                        <select value={customData.fa_status || ''} onChange={e => setCustomData({...customData, fa_status: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700">
                          <option value="">-- เลือกสถานะ --</option>
                          <option value="ใช้งานอยู่ (Active / In Use)">ใช้งานอยู่ (Active / In Use)</option>
                          <option value="ไม่ได้ใช้งาน (Idle)">ไม่ได้ใช้งาน (Idle)</option>
                          <option value="ส่งซ่อม (Under Repair)">ส่งซ่อม (Under Repair)</option>
                          <option value="ตัดจำหน่าย (Written Off)">ตัดจำหน่าย (Written Off)</option>
                          <option value="ขาย/จำหน่าย (Disposed / Sold)">ขาย/จำหน่าย (Disposed / Sold)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-purple-500/50 dark:bg-gray-800" placeholder="เช่น บันทึกการย้ายแผนก หรือ การซ่อมบำรุง..." />
                </div>
              </div>
            )
          }

          if (isFinancialStatement) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-fuchsia-50 dark:bg-fuchsia-900/10 p-6 rounded-xl border border-fuchsia-100 dark:border-fuchsia-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">งบการเงิน (Financial Statements)</h2>
                    <p className="text-gray-500 mt-2">แบบฟอร์มบันทึกข้อมูลงบการเงินและสรุปผลการดำเนินงานของกิจการ</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลทั่วไปของงบ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-fuchsia-100 dark:border-fuchsia-800/50">
                      <div className="md:col-span-2 border-b border-fuchsia-100 dark:border-fuchsia-800/50 pb-2 mb-2 flex justify-between items-end">
                        <h3 className="font-bold text-fuchsia-700 dark:text-fuchsia-500">1. ข้อมูลทั่วไป (General Info)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อกิจการ (Company Name)</label>
                        <input type="text" value={customData.fs_companyName || ''} onChange={e => setCustomData({...customData, fs_companyName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700 font-medium" placeholder="ชื่อบริษัท..." />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประเภทงบการเงิน (Statement Type)</label>
                        <select value={customData.fs_statementType || ''} onChange={e => setCustomData({...customData, fs_statementType: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700">
                          <option value="">-- เลือกประเภทงบ --</option>
                          <option value="งบแสดงฐานะการเงิน (Balance Sheet)">งบแสดงฐานะการเงิน (Balance Sheet)</option>
                          <option value="งบกำไรขาดทุน (Income Statement)">งบกำไรขาดทุน (Income Statement)</option>
                          <option value="งบกระแสเงินสด (Cash Flow Statement)">งบกระแสเงินสด (Cash Flow Statement)</option>
                          <option value="งบแสดงการเปลี่ยนแปลงส่วนของผู้ถือหุ้น (Statement of Changes in Equity)">งบแสดงการเปลี่ยนแปลงส่วนของผู้ถือหุ้น (Statement of Changes in Equity)</option>
                          <option value="งบการเงินฉบับสมบูรณ์ (Complete Financial Statements)">งบการเงินฉบับสมบูรณ์ (Complete Financial Statements)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">สำหรับรอบระยะเวลาสิ้นสุด (For the Period Ended)</label>
                        <input type="text" value={customData.fs_periodEnd || ''} onChange={e => setCustomData({...customData, fs_periodEnd: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700" placeholder="เช่น 31 ธันวาคม 2566..." />
                      </div>
                    </div>

                    {/* สรุปตัวเลขทางการเงิน */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-fuchsia-100 dark:border-fuchsia-800/50">
                      <div className="md:col-span-3 border-b border-fuchsia-100 dark:border-fuchsia-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-fuchsia-700 dark:text-fuchsia-500">2. สรุปตัวเลขทางการเงิน (Financial Summary)</h3>
                      </div>
                      
                      {/* ฐานะการเงิน */}
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รวมสินทรัพย์ (Total Assets)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.fs_totalAssets || ''} onChange={e => setCustomData({...customData, fs_totalAssets: e.target.value})} className="w-full p-2.5 border border-sky-200 dark:border-sky-700 rounded-md outline-none focus:ring-2 focus:ring-sky-500/50 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300" placeholder="0.00" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รวมหนี้สิน (Total Liabilities)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.fs_totalLiabilities || ''} onChange={e => setCustomData({...customData, fs_totalLiabilities: e.target.value})} className="w-full p-2.5 border border-rose-200 dark:border-rose-700 rounded-md outline-none focus:ring-2 focus:ring-rose-500/50 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300" placeholder="0.00" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ส่วนของผู้ถือหุ้น (Total Equity)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={customData.fs_totalEquity || ''} onChange={e => setCustomData({...customData, fs_totalEquity: e.target.value})} className="w-full p-2.5 border border-indigo-200 dark:border-indigo-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300" placeholder="0.00" />
                        </div>
                      </div>

                      {/* ผลการดำเนินงาน */}
                      <div className="md:col-span-3 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2"></div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รวมรายได้ (Total Revenue)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.fs_totalRevenue || ''} onChange={e => setCustomData({...customData, fs_totalRevenue: e.target.value})} className="w-full p-2.5 border border-emerald-200 dark:border-emerald-700 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" placeholder="0.00" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รวมค่าใช้จ่าย (Total Expenses)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={customData.fs_totalExpenses || ''} onChange={e => setCustomData({...customData, fs_totalExpenses: e.target.value})} className="w-full p-2.5 border border-orange-200 dark:border-orange-700 rounded-md outline-none focus:ring-2 focus:ring-orange-500/50 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300" placeholder="0.00" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">กำไร(ขาดทุน)สุทธิ (Net Income/Loss)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={customData.fs_netIncome || ''} onChange={e => setCustomData({...customData, fs_netIncome: e.target.value})} className="w-full p-2.5 border-2 border-fuchsia-300 dark:border-fuchsia-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 bg-fuchsia-50 dark:bg-fuchsia-900/30 text-lg font-bold text-fuchsia-900 dark:text-fuchsia-300" placeholder="0.00" />
                        </div>
                      </div>
                    </div>
                    
                    {/* ผู้สอบบัญชีและความเห็น */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-fuchsia-100 dark:border-fuchsia-800/50">
                      <div className="md:col-span-2 border-b border-fuchsia-100 dark:border-fuchsia-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-fuchsia-700 dark:text-fuchsia-500">3. รายงานผู้สอบบัญชี (Auditor's Report)</h3>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อผู้สอบบัญชีรับอนุญาต (CPA Name)</label>
                        <input type="text" value={customData.fs_auditorName || ''} onChange={e => setCustomData({...customData, fs_auditorName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700" placeholder="ชื่อ-นามสกุล / ชื่อสำนักงานสอบบัญชี..." />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ความเห็นของผู้สอบบัญชี (Audit Opinion)</label>
                        <select value={customData.fs_auditOpinion || ''} onChange={e => setCustomData({...customData, fs_auditOpinion: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:bg-gray-700">
                          <option value="">-- เลือกความเห็น --</option>
                          <option value="แสดงความเห็นอย่างไม่มีเงื่อนไข (Unqualified Opinion)">แสดงความเห็นอย่างไม่มีเงื่อนไข (Unqualified Opinion)</option>
                          <option value="แสดงความเห็นอย่างมีเงื่อนไข (Qualified Opinion)">แสดงความเห็นอย่างมีเงื่อนไข (Qualified Opinion)</option>
                          <option value="แสดงความเห็นว่างบการเงินไม่ถูกต้อง (Adverse Opinion)">แสดงความเห็นว่างบการเงินไม่ถูกต้อง (Adverse Opinion)</option>
                          <option value="ไม่แสดงความเห็น (Disclaimer of Opinion)">ไม่แสดงความเห็น (Disclaimer of Opinion)</option>
                          <option value="ไม่ได้ตรวจสอบ (Unaudited)">ไม่ได้ตรวจสอบ (Unaudited)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุประกอบงบการเงิน (Notes to Financial Statements)</label>
                  <textarea rows={4} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-fuchsia-500/50 dark:bg-gray-800" placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับนโยบายบัญชี หรือรายการที่สำคัญ..." />
                </div>
              </div>
            )
          }

          if (isInvoice) {
            return (
              <div className="p-6 lg:p-10 space-y-8 pt-2">
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ใบแจ้งหนี้ / ใบวางบิล (Invoice / Billing Note)</h2>
                    <p className="text-gray-500 mt-2">แบบฟอร์มสำหรับแจ้งหนี้และเรียกเก็บเงินจากลูกค้า</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* ข้อมูลเอกสารและลูกค้า */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                      <div className="md:col-span-2 border-b border-indigo-100 dark:border-indigo-800/50 pb-2 mb-2 flex justify-between items-end">
                        <h3 className="font-bold text-indigo-700 dark:text-indigo-500">1. ข้อมูลเอกสารและลูกค้า (Document & Customer Info)</h3>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขที่ใบแจ้งหนี้ (Invoice No.)</label>
                        <input type="text" value={customData.inv_invoiceNo || ''} onChange={e => setCustomData({...customData, inv_invoiceNo: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700 font-mono" placeholder="เช่น INV-202310-001..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">วันที่ (Date)</label>
                          <input type="date" value={customData.inv_invoiceDate || ''} onChange={e => setCustomData({...customData, inv_invoiceDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ครบกำหนด (Due Date)</label>
                          <input type="date" value={customData.inv_dueDate || ''} onChange={e => setCustomData({...customData, inv_dueDate: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" />
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 mt-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ชื่อลูกค้า (Customer Name)</label>
                        <input type="text" value={customData.inv_customerName || ''} onChange={e => setCustomData({...customData, inv_customerName: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700 font-medium" placeholder="ชื่อบริษัทหรือชื่อบุคคล..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ที่อยู่ลูกค้า (Customer Address)</label>
                        <textarea rows={2} value={customData.inv_customerAddress || ''} onChange={e => setCustomData({...customData, inv_customerAddress: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700" placeholder="ที่อยู่สำหรับออกใบแจ้งหนี้..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                        <input type="text" value={customData.inv_customerTaxId || ''} onChange={e => setCustomData({...customData, inv_customerTaxId: e.target.value})} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-gray-700 font-mono" placeholder="เลข 13 หลัก..." />
                      </div>
                    </div>

                    {/* รายการสินค้าและบริการ */}
                    <div className="grid grid-cols-1 gap-6 p-5 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                      <div className="border-b border-indigo-100 dark:border-indigo-800/50 pb-2 mb-2">
                        <h3 className="font-bold text-indigo-700 dark:text-indigo-500">2. รายการสินค้า/บริการ (Items & Services)</h3>
                      </div>
                      
                      {/* Line Items Table */}
                      <div className="border border-indigo-100 dark:border-indigo-800/50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                            <tr>
                              <th className="px-4 py-3 font-medium w-16 text-center">ลำดับ</th>
                              <th className="px-4 py-3 font-medium">รายการสินค้า/บริการ</th>
                              <th className="px-4 py-3 font-medium w-32 text-right">จำนวน</th>
                              <th className="px-4 py-3 font-medium w-32">หน่วย</th>
                              <th className="px-4 py-3 font-medium w-40 text-right">ราคา/หน่วย</th>
                              <th className="px-4 py-3 font-medium w-40 text-right">จำนวนเงิน</th>
                              <th className="px-4 py-3 font-medium w-16 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {formData.items.map((item: any, index: number) => (
                              <tr key={item.id} className="bg-white dark:bg-gray-800 group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-4 py-4 text-center text-gray-500">{index + 1}</td>
                                <td className="px-4 py-4">
                                  <input 
                                    type="text" 
                                    value={item.name} 
                                    onChange={e => handleItemChange(index, 'name', e.target.value)} 
                                    placeholder="กรอกชื่อรายการ..."
                                    className="w-full p-2 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 rounded-md outline-none focus:ring-1 focus:ring-indigo-500/50 dark:bg-transparent"
                                  />
                                </td>
                                <td className="px-4 py-4">
                                  <input 
                                    type="number" 
                                    value={item.qty} 
                                    onChange={e => handleItemChange(index, 'qty', Number(e.target.value))} 
                                    className="w-full p-2 text-right border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 rounded-md outline-none focus:ring-1 focus:ring-indigo-500/50 dark:bg-transparent"
                                  />
                                </td>
                                <td className="px-4 py-4">
                                  <input 
                                    type="text" 
                                    value={item.unit} 
                                    onChange={e => handleItemChange(index, 'unit', e.target.value)} 
                                    className="w-full p-2 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 rounded-md outline-none focus:ring-1 focus:ring-indigo-500/50 dark:bg-transparent"
                                  />
                                </td>
                                <td className="px-4 py-4">
                                  <input 
                                    type="number" 
                                    value={item.unitPrice} 
                                    onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))} 
                                    className="w-full p-2 text-right border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 rounded-md outline-none focus:ring-1 focus:ring-indigo-500/50 dark:bg-transparent"
                                  />
                                </td>
                                <td className="px-4 py-4 text-right font-medium text-gray-700 dark:text-gray-200">
                                  {(item.qty * item.unitPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <button type="button" onClick={() => removeItem(index)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-4 h-4 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-800/50">
                          <button 
                            type="button" 
                            onClick={addItem}
                            className="flex items-center gap-1.5 px-4 py-2 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Plus className="w-4 h-4" /> เพิ่มรายการ
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-indigo-100 dark:border-indigo-800/50 mt-4">
                        <div className="space-y-4">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 cursor-pointer">
                              <input type="checkbox" checked={formData.hasVat} onChange={e => setFormData({...formData, hasVat: e.target.checked})} className="w-4 h-4 accent-indigo-600" />
                              คำนวณภาษีมูลค่าเพิ่ม 7% (VAT)
                            </label>
                            {formData.hasVat && (
                              <div className="ml-6 flex items-center gap-3">
                                <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">รูปแบบภาษี</label>
                                <select value={formData.priceType} onChange={e => setFormData({...formData, priceType: e.target.value})} className="w-full sm:w-48 p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-indigo-500/50 dark:bg-gray-800 text-sm">
                                  <option value="exclude_vat">ราคายังไม่รวมภาษี (Exclude VAT)</option>
                                  <option value="include_vat">ราคารวมภาษีแล้ว (Include VAT)</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-gray-600 dark:text-gray-300">รวมเป็นเงิน (Subtotal)</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-600 dark:text-gray-300">ส่วนลด (Discount)</span>
                              <input
                                type="number"
                                value={formData.discountPercent}
                                onChange={e => setFormData({...formData, discountPercent: Number(e.target.value)})}
                                className="w-16 p-1 text-right border border-gray-300 dark:border-gray-600 rounded outline-none focus:ring-1 focus:ring-indigo-500/50 dark:bg-gray-800"
                              />
                              <span className="text-gray-500 font-medium">%</span>
                            </div>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{discountAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                          </div>
                          
                          {formData.discountPercent > 0 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-gray-600 dark:text-gray-300">ราคาหลังหักส่วนลด (After Discount)</span>
                              <span className="font-bold text-gray-800 dark:text-gray-200">{afterDiscount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                            </div>
                          )}

                          {formData.hasVat && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-gray-600 dark:text-gray-300">ภาษีมูลค่าเพิ่ม 7% (VAT)</span>
                              <span className="font-bold text-gray-800 dark:text-gray-200">{vatAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                            </div>
                          )}
                          
                          <div className="pt-2 border-t-2 border-indigo-200 dark:border-indigo-900/50 flex justify-between items-center">
                            <span className="font-bold text-indigo-900 dark:text-indigo-400 text-base">จำนวนเงินรวมทั้งสิ้น (Grand Total)</span>
                            <span className="font-bold text-indigo-900 dark:text-indigo-400 text-lg">{grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                          </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                <div className="max-w-4xl mx-auto mt-8">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุเอกสาร (Document Remarks)</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-indigo-500/50 dark:bg-gray-800" placeholder="เช่น เงื่อนไขการชำระเงิน หรือ ข้อมูลบัญชีธนาคารโอนเงิน..." />
                </div>
              </div>
            )
          }

          return (
            <div className="p-6 lg:p-10 space-y-8 pt-2">
            
            {/* Main Info Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Column: Contact */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                 <h3 className="font-bold text-emerald-600 dark:text-emerald-400">{t.createDocument.contactInfo}</h3>
                 <button type="button" className="text-xs flex items-center gap-1 px-3 py-1.5 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-900 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors">
                   <Search className="w-3 h-3" /> {t.createDocument.searchRevenueDept}
                 </button>
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">{t.createDocument.contactType}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="radio" name="p_type" checked={formData.partnerType==='company'} onChange={() => setFormData({...formData, partnerType: 'company'})} className="accent-emerald-600"/> {t.createDocument.juristicPerson}</label>
                  <label className="flex items-center gap-2 text-sm"><input type="radio" name="p_type" checked={formData.partnerType==='individual'} onChange={() => setFormData({...formData, partnerType: 'individual'})} className="accent-emerald-600"/> {t.createDocument.naturalPerson}</label>
                </div>
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">{t.createDocument.partnerRoleLabel}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="radio" name="p_role" checked={formData.partnerRole==='customer'} onChange={() => setFormData({...formData, partnerRole: 'customer'})} className="accent-emerald-600"/> {t.createDocument.customer}</label>
                  <label className="flex items-center gap-2 text-sm"><input type="radio" name="p_role" checked={formData.partnerRole==='vendor'} onChange={() => setFormData({...formData, partnerRole: 'vendor'})} className="accent-emerald-600"/> {t.createDocument.vendor}</label>
                </div>
              </div>

              <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-2">{t.createDocument.businessName}</label>
                <input type="text" value={formData.partnerName} onChange={e => setFormData({...formData, partnerName: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" placeholder={t.createDocument.enterNamePlaceholder} />
              </div>

              <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-2">{t.createDocument.taxIdLabel}</label>
                <input type="text" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
              </div>

              <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-2">{t.createDocument.addressLabel}</label>
                <textarea rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
              </div>
            </div>

            {/* Right Column: Doc details */}
            <div className="space-y-4">
               <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                 <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t.createDocument.grandTotalLabel}</div>
                 <div className="text-4xl font-light text-emerald-600 dark:text-emerald-400">{grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
               </div>

               <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">{t.createDocument.dateLabel}</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
               </div>

               <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">{t.createDocument.creditDaysLabel}</label>
                <input type="number" value={formData.creditDays} onChange={e => setFormData({...formData, creditDays: Number(e.target.value)})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
               </div>

               <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">{t.createDocument.dueDateLabel}</label>
                <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
               </div>

               <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">{t.createDocument.orderedByLabel}</label>
                <input type="text" value={formData.orderedBy} onChange={e => setFormData({...formData, orderedBy: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" placeholder={t.createDocument.employeeNamePlaceholder} />
               </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-800"/>

          {/* Reference Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">{t.createDocument.projectLabel}</label>
              <input type="text" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">{t.createDocument.referenceNoLabel}</label>
              <input type="text" value={formData.referenceNo} onChange={e => setFormData({...formData, referenceNo: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
            </div>
            <div className="flex items-center gap-3 col-span-1 md:col-span-2">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap pl-4">{t.createDocument.priceTypeLabel}</label>
              <select value={formData.priceType} onChange={e => setFormData({...formData, priceType: e.target.value})} className="w-64 p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800">
                <option value="exclude_vat">{t.createDocument.excludeVat}</option>
                <option value="include_vat">{t.createDocument.includeVat}</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-emerald-600 dark:bg-emerald-700 text-white">
                <tr>
                  <th className="px-4 py-3 font-medium w-16 text-center">{t.createDocument.colIndex}</th>
                  <th className="px-4 py-3 font-medium">{t.createDocument.colItemName}</th>
                  <th className="px-4 py-3 font-medium w-32 text-right">{t.createDocument.colQty}</th>
                  <th className="px-4 py-3 font-medium w-32">{t.createDocument.colUnit}</th>
                  <th className="px-4 py-3 font-medium w-40 text-right">{t.createDocument.colUnitPrice}</th>
                  <th className="px-4 py-3 font-medium w-40 text-right">{t.createDocument.colLineTotal}</th>
                  <th className="px-4 py-3 font-medium w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {formData.items.map((item: any, index: number) => (
                  <tr key={item.id} className="bg-white dark:bg-gray-800 group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-4 text-center text-gray-500">{index + 1}</td>
                    <td className="px-4 py-4">
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={e => handleItemChange(index, 'name', e.target.value)} 
                        placeholder={t.createDocument.itemNamePlaceholder}
                        className="w-full p-2 border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-transparent"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input 
                        type="number" 
                        value={item.qty} 
                        onChange={e => handleItemChange(index, 'qty', Number(e.target.value))} 
                        className="w-full p-2 text-right border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-transparent"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input 
                        type="text" 
                        value={item.unit} 
                        onChange={e => handleItemChange(index, 'unit', e.target.value)} 
                        className="w-full p-2 border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-transparent"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input 
                        type="number" 
                        value={item.unitPrice} 
                        onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))} 
                        className="w-full p-2 text-right border border-transparent focus:border-gray-300 dark:focus:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-transparent"
                      />
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-700 dark:text-gray-200">
                      {(item.qty * item.unitPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button type="button" onClick={() => removeItem(index)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700">
              <button 
                type="button" 
                onClick={addItem}
                className="flex items-center gap-1.5 px-4 py-2 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> {t.createDocument.addItemRow}
              </button>
            </div>
          </div>

          {/* Footer Totals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 cursor-pointer">
                  <input type="checkbox" checked={formData.hasSignature} onChange={e => setFormData({...formData, hasSignature: e.target.checked})} className="w-4 h-4 accent-emerald-600" />
                  {t.createDocument.signatureStamp}
                </label>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">{t.createDocument.remarksLabel}</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">{t.createDocument.internalNotesLabel}</label>
                  <textarea rows={3} value={formData.internalNotes} onChange={e => setFormData({...formData, internalNotes: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                </div>
              </div>
            </div>

            <div className="space-y-4 lg:pl-12 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t.createDocument.subtotalLabel}</span>
                <span className="font-bold text-gray-700 dark:text-gray-200">{subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              <div className="flex justify-between items-center text-sm gap-4">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">{t.createDocument.discountLabel}</span>
                <div className="flex-1 flex justify-end items-center gap-2">
                  <input
                    type="number"
                    value={formData.discountPercent}
                    onChange={e => setFormData({...formData, discountPercent: Number(e.target.value)})}
                    className="w-16 p-1 text-right border border-gray-300 dark:border-gray-600 rounded outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800"
                  />
                  <span className="text-gray-500 font-medium">%</span>
                </div>
                <span className="w-24 text-right font-medium text-gray-700 dark:text-gray-200">{discountAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t.createDocument.afterDiscountLabel}</span>
                <span className="font-medium text-gray-700 dark:text-gray-200">{afterDiscount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer">
                  <input type="checkbox" checked={formData.hasVat} onChange={e => setFormData({...formData, hasVat: e.target.checked})} className="w-4 h-4 accent-emerald-600"/>
                  {t.createDocument.vatLabel}
                </label>
                <span className="font-medium text-gray-700 dark:text-gray-200">{vatAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              <div className="flex justify-between items-center text-base pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t.createDocument.grandTotalLabel}</span>
                <span className="font-bold text-gray-900 dark:text-white text-lg">{grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              <div className="flex justify-between items-center text-sm pt-4">
                <label className="flex items-center gap-2 text-gray-400 font-medium cursor-pointer">
                  <input type="checkbox" checked={formData.hasWht} onChange={e => setFormData({...formData, hasWht: e.target.checked})} className="w-4 h-4 text-gray-400 border-gray-300"/>
                  {t.createDocument.whtLabel}
                </label>
              </div>
            </div>
          </div>
        </div>
          )
        })()}

        {formType === 'CONTACT' && (
          <div className="p-6 lg:p-10 space-y-8 pt-2">
            <h3 className="font-bold text-emerald-600 dark:text-emerald-400">{t.createDocument.contactInfo}</h3>
            <div className="max-w-2xl space-y-6">
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600">{t.createDocument.contactNameLabel}</label>
                <input type="text" value={customData.partnerName || ''} onChange={e => setCustomData({...customData, partnerName: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" />
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600">{t.createDocument.addressLabel}</label>
                <textarea rows={3} value={customData.address || ''} onChange={e => setCustomData({...customData, address: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" />
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600">{t.createDocument.taxIdLabel}</label>
                <input type="text" value={customData.taxId || ''} onChange={e => setCustomData({...customData, taxId: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" />
              </div>
            </div>
          </div>
        )}

        {formType === 'PRODUCT' && (
          <div className="p-6 lg:p-10 space-y-8 pt-2">
            <h3 className="font-bold text-emerald-600 dark:text-emerald-400">{t.createDocument.productInfo}</h3>
            <div className="max-w-2xl space-y-6">
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600">{t.createDocument.productNameLabel}</label>
                <input type="text" value={customData.productName || ''} onChange={e => setCustomData({...customData, productName: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" />
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600">{t.createDocument.skuLabel}</label>
                <input type="text" value={customData.sku || ''} onChange={e => setCustomData({...customData, sku: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" />
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600">{t.createDocument.sellPriceLabel}</label>
                <input type="number" value={customData.price || ''} onChange={e => setCustomData({...customData, price: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" />
              </div>
            </div>
          </div>
        )}

        {formType === 'CUSTOM' && (
          <div className="p-6 lg:p-10 space-y-8 pt-2">
            <h3 className="font-bold text-emerald-600 dark:text-emerald-400">{t.createDocument.customFormTitle}</h3>
            <div className="max-w-2xl space-y-6">
              {formSchema.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-500">
                  {t.createDocument.noCustomFields}
                </div>
              ) : (
                formSchema.map((field: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-[150px_1fr] items-start gap-4">
                    <label className="text-sm font-bold text-gray-600 mt-2">
                      {field.label || field.key} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea 
                        required={field.required}
                        rows={3}
                        value={customData[field.key] || ''} 
                        onChange={e => setCustomData({...customData, [field.key]: e.target.value})} 
                        className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" 
                      />
                    ) : (
                      <input 
                        required={field.required}
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={customData[field.key] || ''} 
                        onChange={e => setCustomData({...customData, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value})} 
                        className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" 
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        </>
        )}

        {step === 3 && (
          <div className="p-6 lg:p-10">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t.createDocument.step3Title}</h2>
                <div className="mt-4 mb-2">
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เลือกเทมเพลตเพื่อแสดงตัวอย่าง</label>
                  <select
                    value={docInfo.templateId}
                    onChange={e => handleTemplateChange(e.target.value)}
                    className="w-full md:w-96 text-sm p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">{t.createDocument.noTemplate}</option>
                    {matchingTemplates.length > 0 && (
                      <optgroup label={t.createDocument.templatesForSelectedType}>
                        {matchingTemplates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {otherTemplates.length > 0 && (
                      <optgroup label={t.createDocument.otherFormTemplates}>
                        {otherTemplates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>
              
              {savedDocument && (
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">สถานะ:</span>
                    {savedDocument.status === 'PENDING' ? (
                      <span className="text-amber-600 dark:text-amber-400">รออนุมัติ</span>
                    ) : savedDocument.status === 'APPROVED' ? (
                      <span className="text-emerald-600 dark:text-emerald-400">อนุมัติแล้ว</span>
                    ) : savedDocument.status === 'REJECTED' ? (
                      <span className="text-rose-600 dark:text-rose-400">ถูกปฏิเสธ</span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-300">ฉบับร่าง (ยังไม่ยื่นอนุมัติ)</span>
                    )}
                  </div>
                  
                  {savedDocument.status !== 'PENDING' && savedDocument.status !== 'APPROVED' && (
                    <button
                      type="button"
                      onClick={handleSubmitForApproval}
                      disabled={isPending}
                      className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      ขอยื่นอนุมัติ
                    </button>
                  )}
                </div>
              )}
            </div>
            {(() => {
              const previewTemplate = templates.find(pt => pt.id === docInfo.templateId)
              if (!savedDocument) {
                return (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    {t.createDocument.noSavedData}
                  </div>
                )
              }
              const selectedDocType = documentTypes.find(t => t.id === docInfo.documentTypeId)
              const isPO = selectedDocType?.name?.includes('สั่งซื้อ') || selectedDocType?.name?.toUpperCase().includes('PO') || selectedDocType?.name?.toLowerCase().includes('purchase order')
              const isInvoice = selectedDocType?.name?.includes('ใบแจ้งหนี้') || selectedDocType?.name?.includes('ใบวางบิล') || selectedDocType?.name?.toLowerCase().includes('invoice') || selectedDocType?.name?.toLowerCase().includes('billing note')

              if (isPO && (!previewTemplate || !hasLayoutElements(previewTemplate.layoutJson))) {
                return (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                      ตัวอย่างใบสั่งซื้อ (Purchase Order)
                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-900 overflow-x-auto">
                      <div className="min-w-[800px] transform origin-top left-1/2 -translate-x-1/2 relative" style={{ transform: 'scale(0.85)' }}>
                        <PurchaseOrderPrintLayout data={mapDocumentToTemplateData(savedDocument, company, { name: getCurrentUser().name })} />
                      </div>
                    </div>
                  </div>
                )
              }

              if (isInvoice && (!previewTemplate || !hasLayoutElements(previewTemplate.layoutJson))) {
                return (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                      ตัวอย่างใบแจ้งหนี้ (Invoice)
                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-900 overflow-x-auto">
                      <div className="min-w-[800px] transform origin-top left-1/2 -translate-x-1/2 relative" style={{ transform: 'scale(0.85)' }}>
                        <InvoicePrintLayout data={mapDocumentToTemplateData(savedDocument, company, { name: getCurrentUser().name })} />
                      </div>
                    </div>
                  </div>
                )
              }

              const isWithholdingTax = selectedDocType?.name?.includes('หัก ณ ที่จ่าย') || selectedDocType?.name?.includes('50 ทวิ')
              if (isWithholdingTax && (!previewTemplate || !hasLayoutElements(previewTemplate.layoutJson))) {
                return (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                      ตัวอย่างหนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)
                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-900 overflow-x-auto">
                      <div className="min-w-[800px] transform origin-top left-1/2 -translate-x-1/2 relative flex justify-center" style={{ transform: 'scale(0.85)' }}>
                        <WithholdingTaxPrintLayout data={mapDocumentToTemplateData(savedDocument, company, { name: getCurrentUser().name })} />
                      </div>
                    </div>
                  </div>
                )
              }
              if (!previewTemplate || !hasLayoutElements(previewTemplate.layoutJson)) {
                return (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    {t.createDocument.noTemplateDesign}
                  </div>
                )
              }
              return (
                <DocumentPreview
                  layoutJsonString={JSON.stringify(previewTemplate.layoutJson)}
                  dataOverride={mapDocumentToTemplateData(savedDocument, company, { name: getCurrentUser().name })}
                />
              )
            })()}
          </div>
        )}
      </div>
    </form>
  )
}
