const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'quotation-bilingual-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `quotation-bilingual-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 15,
    color: '#1f2937',
    ...extra,
  }
}

const elements = [
  element('heading', 38, 34, 240, 34, 'ใบเสนอราคา', { fontSize: 29, fontWeight: 'bold' }),
  element('heading', 38, 70, 190, 30, 'Quotation', { fontSize: 25, fontWeight: 'bold' }),
  element('text', 190, 76, 150, 22, '( ต้นฉบับ / Original )', { fontSize: 16 }),
  element('logo', 468, 30, 82, 82, '{{company_logo}}', { objectFit: 'contain' }),

  element('text', 38, 126, 82, 20, 'ลูกค้า / Customer', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 124, 126, 225, 20, '{{customer_name}}', { fontSize: 15 }),
  element('text', 38, 150, 82, 20, 'ที่อยู่ / Address', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 124, 150, 225, 20, '{{customer_address}}', { fontSize: 14 }),
  element('text', 38, 174, 82, 20, 'เลขผู้เสียภาษี', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 124, 174, 135, 20, '{{customer_tax_id}}', { fontSize: 14 }),
  element('text', 265, 174, 84, 20, 'E: {{customer_email}}', { fontSize: 13 }),
  element('text', 38, 198, 82, 20, 'ผู้ติดต่อ / Attention', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 124, 198, 135, 20, '{{contact_name}}', { fontSize: 14 }),
  element('text', 265, 198, 84, 20, 'T: {{customer_phone}}', { fontSize: 13 }),

  element('text', 392, 126, 65, 20, 'เลขที่ / No.', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 462, 126, 95, 20, '{{doc_no}}', { fontSize: 14 }),
  element('text', 392, 150, 65, 20, 'วันที่ / Issue', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 462, 150, 95, 20, '{{doc_date}}', { fontSize: 14 }),
  element('text', 392, 174, 65, 20, 'ใช้ได้ถึง / Valid', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 462, 174, 95, 20, '{{valid_until}}', { fontSize: 14 }),
  element('text', 392, 198, 65, 20, 'อ้างอิง / Ref', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 462, 198, 95, 20, '{{reference_no}}', { fontSize: 14 }),
  element('line', 38, 224, 519, 1, '', { color: '#9ca3af' }),

  element('text', 38, 238, 58, 20, 'ผู้ออก / Issuer', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 102, 238, 265, 20, '{{company_name}}', { fontSize: 15, fontWeight: 'bold' }),
  element('text', 102, 262, 265, 38, '{{company_address}}', { fontSize: 14 }),
  element('text', 382, 238, 82, 20, 'เลขผู้เสียภาษี', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 468, 238, 89, 20, '{{company_tax_id}}', { fontSize: 14 }),
  element('text', 382, 262, 175, 20, 'T: {{company_phone}}   E: {{company_email}}', { fontSize: 13 }),
  element('text', 382, 286, 175, 20, 'W: {{company_website}}', { fontSize: 13 }),
  element('line', 38, 314, 519, 1, '', { color: '#9ca3af' }),

  element('table', 38, 324, 519, 310, '[รายการสินค้าและบริการ]', {
    fontSize: 13,
    tableColumns: [
      { label: 'รหัส / ID no.', field: 'code', width: 55, align: 'center' },
      { label: 'คำอธิบาย / Description', field: 'description', width: 225, align: 'left' },
      { label: 'จำนวน / Quantity', field: 'quantity', width: 55, align: 'right' },
      { label: 'หน่วย / Unit', field: 'unit', width: 45, align: 'center' },
      { label: 'ราคาต่อหน่วย / Unit Price', field: 'unitPrice', width: 70, align: 'right' },
      { label: 'มูลค่าก่อนภาษี / Pre-Tax', field: 'amount', width: 69, align: 'right' },
    ],
    tableRows: 8,
    tableHeaderBold: true,
    tableHeaderBg: '#f8fafc',
  }),

  element('text', 38, 644, 95, 20, 'หมายเหตุ / Remarks', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 38, 668, 245, 42, '{{remarks}}', { fontSize: 14 }),
  element('text', 300, 644, 165, 20, 'ราคาสุทธิสินค้ายกเว้นภาษี', { fontSize: 13, textAlign: 'right' }),
  element('text', 470, 644, 87, 20, '{{subtotal}}', { fontSize: 14, textAlign: 'right' }),
  element('line', 300, 668, 257, 1, '', { color: '#9ca3af' }),
  element('text', 300, 678, 165, 24, 'จำนวนเงินรวมทั้งสิ้น / Grand Total', { fontSize: 15, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 470, 678, 87, 24, '{{grand_total}}', { fontSize: 17, fontWeight: 'bold', textAlign: 'right' }),
  element('box', 255, 708, 302, 32, '', { backgroundColor: '#f3f4f6', borderColor: '#d1d5db', borderWidth: 1 }),
  element('text', 266, 715, 90, 18, 'Total Amount', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 356, 715, 190, 18, '{{total_amount_text}}', { fontSize: 14, textAlign: 'right' }),
  element('line', 38, 746, 519, 2, '', { color: '#4b5563' }),

  element('text', 38, 758, 155, 20, 'การชำระเงิน / Payment', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 38, 782, 250, 20, 'ธนาคาร {{bank_name}}   ชื่อบัญชี {{account_name}}', { fontSize: 13 }),
  element('text', 38, 806, 250, 20, 'เลขที่บัญชี {{account_no}}', { fontSize: 13 }),
  element('text', 326, 758, 105, 20, 'อนุมัติโดย / Approved by', { fontSize: 13, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 445, 758, 112, 20, 'ยอมรับ / Accepted by', { fontSize: 13, fontWeight: 'bold', textAlign: 'center' }),
  element('line', 326, 806, 105, 1),
  element('line', 445, 806, 112, 1),
  element('text', 326, 812, 105, 18, '{{approved_by}}', { fontSize: 12, textAlign: 'center' }),
  element('text', 445, 812, 112, 18, '{{accepted_by}}', { fontSize: 12, textAlign: 'center' }),
  element('text', 240, 818, 70, 16, 'หน้า 1/1', { fontSize: 12, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { OR: [{ slug: 'QT' }, { name: { contains: 'ใบเสนอราคา' } }], isGlobal: true },
  })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารใบเสนอราคา (QT) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-bilingual-quotation-template'
  const data = {
    name: 'ใบเสนอราคา สองภาษา / Bilingual Quotation',
    slug,
    description: 'เทมเพลตใบเสนอราคาไทย–อังกฤษ พร้อมข้อมูลลูกค้า ผู้ออก ตารางสินค้า ยอดรวม เงื่อนไขชำระเงิน และช่องอนุมัติ',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'ใบเสนอราคา', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
