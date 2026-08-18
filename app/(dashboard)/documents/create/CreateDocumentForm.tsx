'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Link as LinkIcon, ArrowLeft, ArrowRight, Search, Plus, Trash2, Printer, Download, MoreHorizontal, Share2, FileText, CheckCircle2 } from 'lucide-react'
import { createDocument, updateDocument } from '@/app/actions/documents'
import { DocumentPreview } from '@/components/templates/builder/DocumentPreview'
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

  // Base Document Info (Title, Category, etc.)
  const [docInfo, setDocInfo] = useState({
    title: initialData?.title || 'เอกสารใหม่',
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
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-5 h-5" /> {t.createDocument.done}
              </button>
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
                  setDocInfo({ ...docInfo, categoryId: newCat, documentTypeId: typesForCat[0]?.id || '', templateId: '' })
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
                onChange={e => setDocInfo({ ...docInfo, documentTypeId: e.target.value, templateId: '' })}
                disabled={!docInfo.categoryId}
                className="w-full text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
              >
                <option value="" disabled>{t.createDocument.selectDocumentType}</option>
                {documentTypes.filter(t => t.categoryId === docInfo.categoryId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">{t.createDocument.templateOptional}</label>
              <select
                value={docInfo.templateId}
                onChange={e => handleTemplateChange(e.target.value)}
                className="w-full text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                        {template.name} — {template.category?.name || '-'} / {template.documentType?.name || '-'}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {templates.length === 0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  {t.createDocument.noFormTemplates}
                </p>
              )}
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
        {(
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
        )}

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
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t.createDocument.step3Title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.createDocument.step3Subtitle}
              </p>
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
