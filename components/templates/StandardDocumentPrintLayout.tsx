import React from 'react'
import { QuotationPrintLayout, type OnlineSignature } from './QuotationPrintLayout'
import { mapDocumentToTemplateData } from '@/lib/template-data-mapping'
import { documentFieldLabels } from '@/lib/document-field-labels'

type DocumentInput = Parameters<typeof mapDocumentToTemplateData>[0] & {
  title?: string | null
  documentType?: { name?: string | null } | null
}

const labels: Record<string, string> = {
  ...documentFieldLabels,
  leave_type: 'ประเภทการลา', items: 'รายการ', name: 'รายละเอียด', description: 'รายละเอียด',
  qty: 'จำนวน', unit: 'หน่วย', unitPrice: 'ราคาต่อหน่วย', amount: 'จำนวนเงิน',
  date: 'วันที่', dueDate: 'ครบกำหนด', partnerName: 'ชื่อผู้ติดต่อ / คู่ค้า', address: 'ที่อยู่',
  taxId: 'เลขประจำตัวผู้เสียภาษี', referenceNo: 'เลขที่อ้างอิง', project: 'โครงการ',
  subtotal: 'รวมเป็นเงิน', discountAmount: 'ส่วนลด', afterDiscount: 'ราคาหลังหักส่วนลด',
  vatAmount: 'ภาษีมูลค่าเพิ่ม', grandTotal: 'จำนวนเงินรวมทั้งสิ้น',
  wht_items: 'รายการหักภาษี ณ ที่จ่าย', wht_formType: 'ประเภทแบบยื่นภาษี',
  tax: 'ภาษีที่หัก', taxAmount: 'จำนวนภาษี', income: 'เงินได้', incomeType: 'ประเภทเงินได้',
  rate: 'อัตรา', withholdingRate: 'อัตราภาษีหัก ณ ที่จ่าย',
}

const internalFields = new Set([
  'id', 'internalNotes', 'electronicSignature', 'submitterSignature', 'approvalSubmittedAt',
  'hasSignature', 'hasVat', 'hasWht', 'priceType', 'partnerType', 'partnerRole',
  'quotation_tableVersion', 'pv_tableVersion', 'accountType', 'currency', 'creditDays',
  'discountPercent',
])
const financialFields = new Set(['subtotal', 'discountAmount', 'afterDiscount', 'vatAmount', 'grandTotal', 'total'])

function fieldLabel(key: string) {
  return labels[key] || key.replace(/^[a-z]+_/, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
}

function hasValue(value: unknown): boolean {
  if (value == null || value === '') return false
  if (Array.isArray(value)) return value.some(hasValue)
  if (typeof value === 'object') return Object.values(value).some(hasValue)
  return true
}

function FieldValue({ value }: { value: unknown }): React.ReactNode {
  if (typeof value === 'boolean') return value ? 'ใช่' : 'ไม่ใช่'
  if (Array.isArray(value)) return <div className="space-y-3">{value.map((item, index) => <div key={index} className="break-inside-avoid border-b border-sky-100 pb-2"><FieldValue value={item} /></div>)}</div>
  if (value && typeof value === 'object') return <dl className="space-y-1">{Object.entries(value).filter(([key, item]) => !internalFields.has(key) && hasValue(item)).map(([key, item]) => <div key={key}><dt className="inline font-medium">{fieldLabel(key)}: </dt><dd className="inline"><FieldValue value={item} /></dd></div>)}</dl>
  return String(value ?? '')
}

/** One standard A4 design for every document category, using the saved form fields. */
export function StandardDocumentPrintLayout({ document, company, createdBy, documentTypeName, signature, submitterSignature }: {
  document: DocumentInput
  company?: Parameters<typeof mapDocumentToTemplateData>[1]
  createdBy?: Parameters<typeof mapDocumentToTemplateData>[2]
  documentTypeName?: string
  signature?: OnlineSignature | null
  submitterSignature?: OnlineSignature | null
}) {
  const title = documentTypeName || document.documentType?.name || document.title || 'เอกสาร'
  const mapped = mapDocumentToTemplateData(document, company, createdBy)
  let raw: Record<string, unknown> = {}
  try {
    const parsed = typeof document.dataJson === 'string' ? JSON.parse(document.dataJson) : document.dataJson
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) raw = parsed
  } catch { /* An empty form still has a printable company/document header. */ }

  const quotation = /ใบเสนอราคา|quotation/i.test(title)
  if (quotation) return <QuotationPrintLayout data={mapped} documentTitle={title} signature={signature} submitterSignature={submitterSignature} />

  const purchase = /ใบสั่งซื้อ|purchase order/i.test(title)
  const invoice = /ใบแจ้งหนี้|ใบวางบิล|invoice|billing note/i.test(title)
  const monetary = purchase || invoice
  const rows = Object.entries(raw).filter(([key, value]) => {
    if (internalFields.has(key) || !hasValue(value)) return false
    if (key === 'date' || key === 'dueDate') return false
    if (financialFields.has(key) || key === 'items') return !monetary && (key === 'items'
      ? Array.isArray(value) && value.some(item => item && typeof item === 'object' && (item.name || item.description))
      : Number(value) !== 0)
    if (monetary && ['remarks', 'po_paymentTerms'].includes(key)) return false
    return true
  })
  const fields = <section className="mb-8">
    <h2 className="border-y border-sky-200 bg-sky-50 px-3 py-2 font-semibold text-sky-700">รายละเอียดเอกสาร</h2>
    <dl>{rows.map(([key, value]) => <div key={key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-b border-gray-100 px-3 py-2 break-inside-avoid">
      <dt className="font-medium text-sky-700 break-words">{fieldLabel(key)}</dt>
      <dd className="whitespace-pre-wrap break-words"><FieldValue value={value} />{key === 'leave_totalDays' ? ' วัน' : ''}</dd>
    </div>)}</dl>
    {rows.length === 0 && <p className="p-3 text-gray-500">ยังไม่มีรายละเอียดเอกสาร</p>}
  </section>

  const data = {
    ...mapped,
    doc_date: raw.leave_requestDate || raw.inv_invoiceDate || raw.po_date || mapped.doc_date,
    customer_name: purchase ? mapped.po_vendor_name : invoice ? mapped.inv_customer_name : mapped.customer_name,
    customer_address: purchase ? mapped.po_vendor_address : invoice ? mapped.inv_customer_address : mapped.customer_address,
    quotation_ref_no: purchase ? mapped.po_ref_no : invoice ? mapped.inv_ref_no : '',
  }
  return <QuotationPrintLayout data={data} documentTitle={title} dateLabel="วันที่เอกสาร"
    dueDateLabel={monetary ? 'ครบกำหนด' : ''} partyLabel={purchase ? 'ผู้จำหน่าย' : 'ลูกค้า'}
    submitterLabel="ผู้จัดทำ / ผู้ยื่นขออนุมัติ" approverLabel="ผู้อนุมัติ"
    signature={signature} submitterSignature={submitterSignature} details={monetary ? fields : undefined}>
    {monetary ? undefined : fields}
  </QuotationPrintLayout>
}
