const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'purchase-requisition-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `purchase-requisition-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 14,
    color: '#111827',
    ...extra,
  }
}

const accent = '#0f766e'
const border = '#64748b'

const elements = [
  element('logo', 28, 28, 72, 72, '[โลโก้บริษัท]'),
  element('heading', 115, 28, 365, 34, '{{company_name}}', { fontSize: 23, fontWeight: 'bold', textAlign: 'center' }),
  element('paragraph', 115, 66, 365, 66,
    '{{company_address}}\nโทร. {{company_phone}}  อีเมล {{company_email}}\nเลขประจำตัวผู้เสียภาษี {{company_tax_id}}',
    { fontSize: 13, textAlign: 'center' }),
  element('text', 500, 20, 55, 18, 'หน้า 1 / 1', { fontSize: 10, textAlign: 'right', color: '#64748b' }),
  element('heading', 45, 142, 505, 34, 'ใบขออนุมัติจัดซื้อ', { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: accent }),
  element('text', 45, 176, 505, 24, 'Purchase Requisition (PR) / เปรียบเทียบราคาซื้อ', { fontSize: 14, textAlign: 'center', color: '#475569' }),

  element('box', 352, 211, 198, 76, '', { borderColor: border }),
  element('text', 360, 219, 70, 22, 'เลขที่เอกสาร', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 435, 219, 108, 22, '{{document_number}}', { fontSize: 13 }),
  element('line', 352, 248, 198, 1, '', { color: border }),
  element('text', 360, 256, 70, 22, 'วันที่เอกสาร', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 435, 256, 108, 22, '{{document_date}}', { fontSize: 13 }),
  element('text', 45, 218, 285, 22, 'ผู้ขอซื้อ {{requester_name}}', { fontSize: 14 }),
  element('text', 45, 246, 285, 22, 'แผนก/ฝ่าย {{requester_department}}', { fontSize: 14 }),
  element('text', 45, 274, 285, 22, 'วัตถุประสงค์ {{purchase_purpose}}', { fontSize: 14 }),

  element('table', 28, 310, 539, 315, '[รายการขออนุมัติจัดซื้อ]', {
    fontSize: 11,
    tableColumns: [
      { label: 'รหัสสินค้า', field: 'code', width: 72, align: 'left' },
      { label: 'รายการ / รายละเอียด', field: 'name', width: 164, align: 'left' },
      { label: 'จำนวน', field: 'qty', width: 52, align: 'right' },
      { label: 'หน่วยนับ', field: 'unit', width: 55, align: 'center' },
      { label: 'ราคา/หน่วย', field: 'unitPrice', width: 72, align: 'right' },
      { label: 'ส่วนลด', field: 'discount', width: 55, align: 'right' },
      { label: 'จำนวนเงิน', field: 'total', width: 69, align: 'right' },
    ],
    tableRows: 12,
    tableHeaderBold: true,
    tableHeaderBg: '#f0fdfa',
    borderColor: border,
  }),

  element('box', 28, 634, 539, 82, '', { borderColor: border }),
  element('heading', 38, 643, 80, 22, 'หมายเหตุ', { fontSize: 14, fontWeight: 'bold', color: accent }),
  element('paragraph', 38, 668, 330, 38, '{{remarks}}', { fontSize: 13 }),
  element('text', 390, 643, 95, 22, 'ยอดรวมก่อนภาษี', { fontSize: 13, textAlign: 'right' }),
  element('text', 490, 643, 67, 22, '{{subtotal}}', { fontSize: 13, textAlign: 'right' }),
  element('text', 390, 666, 95, 22, 'ภาษีมูลค่าเพิ่ม', { fontSize: 13, textAlign: 'right' }),
  element('text', 490, 666, 67, 22, '{{vat}}', { fontSize: 13, textAlign: 'right' }),
  element('text', 390, 689, 95, 22, 'ยอดรวมทั้งสิ้น', { fontSize: 13, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 490, 689, 67, 22, '{{grand_total}}', { fontSize: 14, fontWeight: 'bold', textAlign: 'right', color: accent }),

  element('box', 28, 728, 539, 88, '', { borderColor: border }),
  element('line', 297, 728, 1, 88, '', { color: border }),
  element('line', 82, 778, 160, 1, '', { color: border }),
  element('line', 352, 778, 160, 1, '', { color: border }),
  element('text', 82, 742, 160, 24, '{{requester_name}}', { fontSize: 13, textAlign: 'center' }),
  element('text', 352, 742, 160, 24, '{{approver_name}}', { fontSize: 13, textAlign: 'center' }),
  element('text', 82, 783, 160, 18, 'ผู้จัดทำ / ผู้ขอซื้อ', { fontSize: 12, textAlign: 'center' }),
  element('text', 352, 783, 160, 18, 'ผู้อนุมัติ', { fontSize: 12, textAlign: 'center' }),
  element('text', 82, 801, 160, 14, 'วันที่ {{request_date}}', { fontSize: 11, textAlign: 'center' }),
  element('text', 352, 801, 160, 14, 'วันที่ {{approval_date}}', { fontSize: 11, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'PR', isGlobal: true },
  })

  if (!documentType) throw new Error('ไม่พบประเภทเอกสารใบขออนุมัติจัดซื้อ (PR) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-purchase-requisition-template'
  const data = {
    name: 'ใบขออนุมัติจัดซื้อ (Purchase Requisition - PR)',
    slug,
    description: 'เทมเพลตใบขออนุมัติจัดซื้อ A4 พร้อมข้อมูลผู้ขอซื้อ วัตถุประสงค์ ตารางรายการสินค้าแบบหลายแถว สรุปยอด หมายเหตุ และช่องลงนามอนุมัติ',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'ใบขออนุมัติจัดซื้อ (PR)', order: 1, width: 595, height: 842, background: '#ffffff' }],
      elements,
    },
    paperSize: PaperSize.A4,
    orientation: PaperOrientation.PORTRAIT,
    isGlobal: true,
    isActive: true,
    createdByAdminId: admin?.id,
  }

  const existing = await prisma.documentTemplate.findFirst({ where: { slug, isGlobal: true } })
  const template = existing
    ? await prisma.documentTemplate.update({ where: { id: existing.id }, data })
    : await prisma.documentTemplate.create({ data })

  console.log(JSON.stringify({ id: template.id, name: template.name, slug: template.slug }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
