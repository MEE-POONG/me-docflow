'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Link as LinkIcon, ArrowLeft, ArrowRight, Search, Plus, Trash2, Printer, Download, MoreHorizontal, Share2, FileText, CheckCircle2 } from 'lucide-react'
import { createDocument, updateDocument } from '@/app/actions/documents'
import { DocumentPreview } from '@/components/templates/builder/DocumentPreview'
import { mapDocumentToTemplateData } from '@/lib/template-data-mapping'
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
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<1 | 2 | 3>(initialData ? 2 : 1)
  const [savedDocument, setSavedDocument] = useState<any>(initialData || null)

  // Base Document Info (Title, Category, etc.)
  const [docInfo, setDocInfo] = useState({
    title: initialData?.title || 'เอกสารใหม่',
    categoryId: initialData?.categoryId || (categories.length > 0 ? categories[0].id : ''),
    documentTypeId: initialData?.documentTypeId || (documentTypes.length > 0 ? documentTypes[0].id : ''),
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
  const formType = selectedTemplate?.formType || 'STANDARD'
  const formSchema = selectedTemplate?.formSchema ? (typeof selectedTemplate.formSchema === 'string' ? JSON.parse(selectedTemplate.formSchema) : selectedTemplate.formSchema) : []

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

    let dataJson = ''
    if (formType === 'STANDARD') {
      dataJson = JSON.stringify({
        ...formData,
        subtotal,
        discountAmount,
        afterDiscount,
        vatAmount,
        grandTotal
      })
    } else {
      dataJson = JSON.stringify(customData)
    }

    startTransition(async () => {
      let result

      const currentUserEmail = getCurrentUser().email

      const payload = {
        title: formType === 'STANDARD' && formData.partnerName ? `${docInfo.title} - ${formData.partnerName}` : docInfo.title,
        categoryId: docInfo.categoryId,
        documentTypeId: docInfo.documentTypeId,
        templateId: docInfo.templateId || undefined,
        dataJson,
        subtotalSatang: formType === 'STANDARD' ? Math.round(subtotal * 100) : 0,
        vatSatang: formType === 'STANDARD' ? Math.round(vatAmount * 100) : 0,
        totalSatang: formType === 'STANDARD' ? Math.round(grandTotal * 100) : 0,
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
        alert('เกิดข้อผิดพลาดในการบันทึกเอกสาร: ' + result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[1400px] mx-auto pb-20 p-2 md:p-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Link href="/documents" className="text-gray-500 hover:text-indigo-600 flex items-center gap-2 mb-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> กลับหน้ารายการ
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <FileText className="w-7 h-7 text-[#38A1C5]" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {initialData ? 'แก้ไขเอกสาร' : 'สร้างเอกสารใหม่'}
              <span className="text-[#38A1C5] ml-3">{initialData?.documentNo || savedDocument?.documentNo || 'Auto Generated'}</span>
            </h1>
            <span className="ml-2 text-xs font-bold px-2.5 py-1 rounded-full bg-[#38A1C5]/10 text-[#38A1C5]">
              ขั้นตอนที่ {step}/3
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/documents" className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900 shadow-sm text-sm font-medium">
            ปิดหน้าต่าง
          </Link>
          {step === 1 && (
            <button
              type="button"
              disabled={!docInfo.categoryId || !docInfo.documentTypeId}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-2 bg-[#6DB235] hover:bg-[#5a962a] text-white rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 text-sm"
            >
              ถัดไป: กรอกข้อมูล <ArrowRight className="w-5 h-5" />
            </button>
          )}
          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2 bg-[#6DB235] hover:bg-[#5a962a] text-white rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 text-sm"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                บันทึกเอกสาร
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
                <ArrowLeft className="w-4 h-4" /> ย้อนกลับไปแก้ไข
              </button>
              <button
                type="button"
                onClick={() => router.push('/documents')}
                className="flex items-center gap-2 px-6 py-2 bg-[#6DB235] hover:bg-[#5a962a] text-white rounded-lg font-medium transition-all shadow-sm text-sm"
              >
                <CheckCircle2 className="w-5 h-5" /> เสร็จสิ้น
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">

        {step === 1 && (
        <div className="p-8 md:p-12 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">ขั้นตอนที่ 1: เลือกหมวดหมู่และประเภทเอกสาร</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">เลือกหมวดหมู่ ประเภทเอกสาร และเทมเพลต (ถ้ามี) ก่อนเริ่มกรอกข้อมูล</p>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมวดหมู่ <span className="text-red-500">*</span></label>
              <select
                value={docInfo.categoryId}
                onChange={e => {
                  const newCat = e.target.value
                  const typesForCat = documentTypes.filter(t => t.categoryId === newCat)
                  setDocInfo({ ...docInfo, categoryId: newCat, documentTypeId: typesForCat[0]?.id || '', templateId: '' })
                }}
                className="w-full text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="" disabled>เลือกหมวดหมู่</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">ประเภทเอกสาร <span className="text-red-500">*</span></label>
              <select
                value={docInfo.documentTypeId}
                onChange={e => setDocInfo({ ...docInfo, documentTypeId: e.target.value, templateId: '' })}
                disabled={!docInfo.categoryId}
                className="w-full text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="" disabled>เลือกประเภทเอกสาร</option>
                {documentTypes.filter(t => t.categoryId === docInfo.categoryId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">เทมเพลต (ถ้ามี)</label>
              <select
                value={docInfo.templateId}
                onChange={e => setDocInfo({ ...docInfo, templateId: e.target.value })}
                className="w-full text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- ไม่ใช้เทมเพลต --</option>
                {templates.filter(t => t.documentTypeId === docInfo.documentTypeId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
          <button type="button" onClick={() => setStep(1)} className="text-xs font-medium text-[#38A1C5] hover:underline">
            เปลี่ยนหมวดหมู่/ประเภทเอกสาร
          </button>
        </div>

        {/* Action icons bar */}
        <div className="flex justify-end px-6 pt-4 pb-2 gap-6 text-[#38A1C5]">
           <button type="button" className="flex flex-col items-center gap-1 hover:text-blue-700 transition-colors"><Share2 className="w-5 h-5"/> <span className="text-xs">แชร์</span></button>
           <button type="button" onClick={() => {
             const savedId = savedDocument?.id || initialData?.id
             if (savedId) {
               window.open(`/documents/${savedId}?print=true`, '_blank');
             } else {
               alert('กรุณาบันทึกเอกสารก่อนทำการพิมพ์');
             }
           }} className="flex flex-col items-center gap-1 hover:text-blue-700 transition-colors"><Printer className="w-5 h-5"/> <span className="text-xs">พิมพ์</span></button>
           <button type="button" className="flex flex-col items-center gap-1 hover:text-blue-700 transition-colors"><Download className="w-5 h-5"/> <span className="text-xs">ดาวน์โหลด</span></button>
           <button type="button" className="flex flex-col items-center gap-1 hover:text-blue-700 transition-colors text-gray-500"><MoreHorizontal className="w-5 h-5"/> <span className="text-xs">เพิ่มเติม</span></button>
        </div>

        {formType === 'STANDARD' && (
          <div className="p-6 lg:p-10 space-y-8 pt-2">
            
            {/* Main Info Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Column: Contact */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                 <h3 className="font-bold text-[#38A1C5]">ข้อมูลผู้ติดต่อ</h3>
                 <button type="button" className="text-xs flex items-center gap-1 px-3 py-1.5 border border-[#38A1C5] text-[#38A1C5] bg-white rounded-md hover:bg-blue-50 transition-colors">
                   <Search className="w-3 h-3" /> ค้นหาจากฐานข้อมูลกรมสรรพากร
                 </button>
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">ประเภทผู้ติดต่อ:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="radio" name="p_type" checked={formData.partnerType==='company'} onChange={() => setFormData({...formData, partnerType: 'company'})} className="text-[#38A1C5]"/> นิติบุคคล</label>
                  <label className="flex items-center gap-2 text-sm"><input type="radio" name="p_type" checked={formData.partnerType==='individual'} onChange={() => setFormData({...formData, partnerType: 'individual'})} className="text-[#38A1C5]"/> บุคคลธรรมดา</label>
                </div>
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">ประเภท:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="radio" name="p_role" checked={formData.partnerRole==='customer'} onChange={() => setFormData({...formData, partnerRole: 'customer'})} className="text-[#38A1C5]"/> ลูกค้า</label>
                  <label className="flex items-center gap-2 text-sm"><input type="radio" name="p_role" checked={formData.partnerRole==='vendor'} onChange={() => setFormData({...formData, partnerRole: 'vendor'})} className="text-[#38A1C5]"/> ผู้จำหน่าย</label>
                </div>
              </div>

              <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-2">ชื่อธุรกิจ:</label>
                <input type="text" value={formData.partnerName} onChange={e => setFormData({...formData, partnerName: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" placeholder="ระบุชื่อ..." />
              </div>
              
              <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-2">เลขผู้เสียภาษี:</label>
                <input type="text" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
              </div>

              <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-2">ที่อยู่:</label>
                <textarea rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
              </div>
            </div>

            {/* Right Column: Doc details */}
            <div className="space-y-4">
               <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                 <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">จำนวนเงินรวมทั้งสิ้น</div>
                 <div className="text-4xl font-light text-[#38A1C5]">{grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
               </div>

               <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">วันที่:</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
               </div>

               <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">เครดิต (วัน):</label>
                <input type="number" value={formData.creditDays} onChange={e => setFormData({...formData, creditDays: Number(e.target.value)})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
               </div>

               <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">ครบกำหนด:</label>
                <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
               </div>

               <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">ผู้สั่งซื้อ:</label>
                <input type="text" value={formData.orderedBy} onChange={e => setFormData({...formData, orderedBy: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" placeholder="ชื่อพนักงาน" />
               </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-800"/>

          {/* Reference Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">โปรเจ็ค:</label>
              <input type="text" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">เลขที่อ้างอิง:</label>
              <input type="text" value={formData.referenceNo} onChange={e => setFormData({...formData, referenceNo: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
            </div>
            <div className="flex items-center gap-3 col-span-1 md:col-span-2">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap pl-4">ราคาสินค้า:</label>
              <select value={formData.priceType} onChange={e => setFormData({...formData, priceType: e.target.value})} className="w-64 p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800">
                <option value="exclude_vat">ราคาไม่รวมภาษี</option>
                <option value="include_vat">ราคารวมภาษีแล้ว</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#38A1C5] text-white">
                <tr>
                  <th className="px-4 py-3 font-medium w-16 text-center">ลำดับ</th>
                  <th className="px-4 py-3 font-medium">ชื่อสินค้า / รายละเอียด</th>
                  <th className="px-4 py-3 font-medium w-32 text-right">จำนวน</th>
                  <th className="px-4 py-3 font-medium w-32">หน่วย</th>
                  <th className="px-4 py-3 font-medium w-40 text-right">ราคาต่อหน่วย</th>
                  <th className="px-4 py-3 font-medium w-40 text-right">ราคารวม</th>
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
                        placeholder="พิมพ์ชื่อสินค้า..."
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
                className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 text-[#38A1C5] bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> เพิ่มแถวรายการ
              </button>
            </div>
          </div>

          {/* Footer Totals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 cursor-pointer">
                  <input type="checkbox" checked={formData.hasSignature} onChange={e => setFormData({...formData, hasSignature: e.target.checked})} className="w-4 h-4 text-[#38A1C5]" />
                  ลายเซ็นอิเล็กทรอนิกส์และตรายาง
                </label>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">หมายเหตุ:</label>
                  <textarea rows={3} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">โน้ตภายในบริษัท:</label>
                  <textarea rows={3} value={formData.internalNotes} onChange={e => setFormData({...formData, internalNotes: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5] dark:bg-gray-800" />
                </div>
              </div>
            </div>

            <div className="space-y-4 lg:pl-12 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#38A1C5] font-bold">รวมเป็นเงิน</span>
                <span className="font-bold text-gray-700 dark:text-gray-200">{subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm gap-4">
                <span className="text-[#38A1C5] font-medium whitespace-nowrap">ส่วนลด</span>
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
                <span className="text-[#38A1C5] font-medium">ราคาหลังหักส่วนลด</span>
                <span className="font-medium text-gray-700 dark:text-gray-200">{afterDiscount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-[#38A1C5] font-medium cursor-pointer">
                  <input type="checkbox" checked={formData.hasVat} onChange={e => setFormData({...formData, hasVat: e.target.checked})} className="w-4 h-4 text-[#38A1C5]"/>
                  ภาษีมูลค่าเพิ่ม 7%
                </label>
                <span className="font-medium text-gray-700 dark:text-gray-200">{vatAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              <div className="flex justify-between items-center text-base pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
                <span className="text-[#38A1C5] font-bold">จำนวนเงินรวมทั้งสิ้น</span>
                <span className="font-bold text-gray-900 dark:text-white text-lg">{grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              <div className="flex justify-between items-center text-sm pt-4">
                <label className="flex items-center gap-2 text-gray-400 font-medium cursor-pointer">
                  <input type="checkbox" checked={formData.hasWht} onChange={e => setFormData({...formData, hasWht: e.target.checked})} className="w-4 h-4 text-gray-400 border-gray-300"/>
                  หักภาษี ณ ที่จ่าย
                </label>
              </div>
            </div>
          </div>

        </div>
        )}

        {formType === 'CONTACT' && (
          <div className="p-6 lg:p-10 space-y-8 pt-2">
            <h3 className="font-bold text-[#38A1C5]">ข้อมูลผู้ติดต่อ</h3>
            <div className="max-w-2xl space-y-6">
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600">ชื่อผู้ติดต่อ:</label>
                <input type="text" value={customData.partnerName || ''} onChange={e => setCustomData({...customData, partnerName: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" />
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600">ที่อยู่:</label>
                <textarea rows={3} value={customData.address || ''} onChange={e => setCustomData({...customData, address: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" />
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600">เลขผู้เสียภาษี:</label>
                <input type="text" value={customData.taxId || ''} onChange={e => setCustomData({...customData, taxId: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" />
              </div>
            </div>
          </div>
        )}

        {formType === 'PRODUCT' && (
          <div className="p-6 lg:p-10 space-y-8 pt-2">
            <h3 className="font-bold text-[#38A1C5]">ข้อมูลสินค้า</h3>
            <div className="max-w-2xl space-y-6">
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600">ชื่อสินค้า:</label>
                <input type="text" value={customData.productName || ''} onChange={e => setCustomData({...customData, productName: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" />
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600">รหัสสินค้า (SKU):</label>
                <input type="text" value={customData.sku || ''} onChange={e => setCustomData({...customData, sku: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" />
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-bold text-gray-600">ราคาขาย:</label>
                <input type="number" value={customData.price || ''} onChange={e => setCustomData({...customData, price: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#38A1C5]" />
              </div>
            </div>
          </div>
        )}

        {formType === 'CUSTOM' && (
          <div className="p-6 lg:p-10 space-y-8 pt-2">
            <h3 className="font-bold text-[#38A1C5]">แบบฟอร์มข้อมูล (Custom Form)</h3>
            <div className="max-w-2xl space-y-6">
              {formSchema.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-500">
                  เทมเพลตนี้ยังไม่มีการกำหนดช่องกรอกข้อมูล (Custom Fields)
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
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">ขั้นตอนที่ 3: ตัวอย่างเอกสาร</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ตรวจสอบข้อมูลที่กรอกก่อนพิมพ์หรือส่งอนุมัติ — สามารถย้อนกลับไปแก้ไขข้อมูลได้
              </p>
            </div>
            {(() => {
              const previewTemplate = templates.find(t => t.id === docInfo.templateId)
              if (!savedDocument) {
                return (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    ไม่พบข้อมูลเอกสารที่บันทึกไว้
                  </div>
                )
              }
              if (!previewTemplate || !hasLayoutElements(previewTemplate.layoutJson)) {
                return (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    เอกสารนี้ไม่ได้ใช้เทมเพลตที่มีรูปแบบการออกแบบ — บันทึกข้อมูลเรียบร้อยแล้ว
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
