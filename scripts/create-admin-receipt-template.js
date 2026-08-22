const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'receipt-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `receipt-${sequence}`,
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

const green = '#65a92f'
const lightGreen = '#f0f8ea'
const elements = [
  element('logo', 40, 32, 165, 52, '{{company_logo}}', { objectFit: 'contain' }),
  element('heading', 384, 34, 155, 28, 'ใบเสร็จรับเงิน', { fontSize: 23, fontWeight: 'bold', textAlign: 'right', color: green }),
  element('heading', 384, 62, 155, 24, 'ต้นฉบับ / ORIGINAL', { fontSize: 15, textAlign: 'right', color: green }),
  element('box', 542, 20, 32, 60, '1', { backgroundColor: green, color: '#ffffff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }),

  element('text', 40, 94, 245, 18, '{{company_name}}', { fontSize: 15, fontWeight: 'bold' }),
  element('text', 40, 114, 245, 44, '{{company_address}}', { fontSize: 13 }),
  element('text', 40, 160, 245, 18, 'เลขผู้เสียภาษี {{company_tax_id}}', { fontSize: 13 }),
  element('text', 40, 180, 245, 18, 'โทร. {{company_phone}}', { fontSize: 13 }),

  element('text', 340, 94, 72, 18, 'เลขที่', { fontSize: 13, color: green }),
  element('text', 414, 94, 125, 18, '{{doc_no}}', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 340, 114, 72, 18, 'วันที่', { fontSize: 13, color: green }),
  element('text', 414, 114, 125, 18, '{{doc_date}}', { fontSize: 14 }),
  element('text', 340, 134, 72, 18, 'วันที่อ้างอิง', { fontSize: 13, color: green }),
  element('text', 414, 134, 125, 18, '{{reference_date}}', { fontSize: 14 }),
  element('text', 340, 154, 72, 18, 'ผู้ขาย', { fontSize: 13, color: green }),
  element('text', 414, 154, 125, 18, '{{salesperson}}', { fontSize: 14 }),

  element('line', 40, 208, 499, 1, '', { color: '#d1d5db' }),
  element('text', 40, 220, 60, 18, 'ลูกค้า', { fontSize: 13, color: green }),
  element('text', 102, 220, 190, 18, '{{customer_name}}', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 40, 240, 60, 18, 'ที่อยู่', { fontSize: 13, color: green }),
  element('text', 102, 240, 190, 38, '{{customer_address}}', { fontSize: 13 }),
  element('text', 40, 280, 60, 18, 'เลขผู้เสียภาษี', { fontSize: 13, color: green }),
  element('text', 102, 280, 190, 18, '{{customer_tax_id}}', { fontSize: 13 }),
  element('text', 340, 220, 72, 18, 'ผู้ติดต่อ', { fontSize: 13, color: green }),
  element('text', 414, 220, 125, 18, '{{contact_name}}', { fontSize: 14 }),
  element('text', 340, 240, 72, 18, 'เบอร์โทร', { fontSize: 13, color: green }),
  element('text', 414, 240, 125, 18, '{{customer_phone}}', { fontSize: 13 }),
  element('text', 340, 260, 72, 18, 'อีเมล', { fontSize: 13, color: green }),
  element('text', 414, 260, 125, 18, '{{customer_email}}', { fontSize: 13 }),

  element('table', 40, 312, 499, 245, '[รายการรับชำระเงิน]', {
    fontSize: 13,
    tableColumns: [
      { label: '#', field: 'no', width: 34, align: 'center' },
      { label: 'รายละเอียด', field: 'description', width: 240, align: 'left' },
      { label: 'จำนวน', field: 'quantity', width: 55, align: 'right' },
      { label: 'ราคาต่อหน่วย', field: 'unitPrice', width: 80, align: 'right' },
      { label: 'ยอดรวม', field: 'amount', width: 90, align: 'right' },
    ],
    tableRows: 6,
    tableHeaderBold: true,
    tableHeaderBg: '#ffffff',
  }),

  element('text', 40, 568, 260, 38, '{{total_amount_text}}', { fontSize: 13 }),
  element('text', 342, 568, 108, 20, 'รวมเป็นเงิน', { fontSize: 14, color: green, textAlign: 'right' }),
  element('text', 456, 568, 83, 20, '{{subtotal}}', { fontSize: 14, textAlign: 'right' }),
  element('text', 342, 590, 108, 20, 'ภาษีมูลค่าเพิ่ม {{vat_rate}}%', { fontSize: 13, color: green, textAlign: 'right' }),
  element('text', 456, 590, 83, 20, '{{vat_amount}}', { fontSize: 14, textAlign: 'right' }),
  element('text', 342, 612, 108, 20, 'จำนวนเงินรวมทั้งสิ้น', { fontSize: 14, fontWeight: 'bold', color: green, textAlign: 'right' }),
  element('text', 456, 612, 83, 20, '{{grand_total}}', { fontSize: 16, fontWeight: 'bold', textAlign: 'right' }),
  element('line', 342, 636, 197, 1, '', { color: '#d1d5db' }),

  element('box', 40, 654, 499, 72, '', { backgroundColor: lightGreen, borderColor: '#dbe8d2', borderWidth: 1 }),
  element('text', 52, 664, 475, 18, 'การชำระเงิน:  □ เงินสด   □ เช็ค   □ โอนเงิน   □ บัตรเครดิต', { fontSize: 13 }),
  element('text', 52, 686, 150, 18, 'ธนาคาร {{bank_name}}', { fontSize: 13 }),
  element('text', 205, 686, 125, 18, 'เลขที่ {{cheque_no}}', { fontSize: 13 }),
  element('text', 334, 686, 100, 18, 'วันที่ {{cheque_date}}', { fontSize: 13 }),
  element('text', 438, 686, 89, 18, 'จำนวน {{paid_amount}}', { fontSize: 13, textAlign: 'right' }),
  element('text', 52, 708, 475, 15, 'หมายเหตุ {{payment_note}}', { fontSize: 12 }),

  element('text', 40, 744, 220, 18, 'ในนาม {{customer_name}}', { fontSize: 13 }),
  element('text', 319, 744, 220, 18, 'ในนาม {{company_name}}', { fontSize: 13, textAlign: 'right' }),
  element('line', 58, 790, 160, 1),
  element('line', 361, 790, 160, 1),
  element('text', 58, 798, 160, 18, 'ผู้จ่ายเงิน          วันที่ {{payer_date}}', { fontSize: 12, textAlign: 'center' }),
  element('text', 361, 798, 160, 18, 'ผู้รับเงิน          วันที่ {{receiver_date}}', { fontSize: 12, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { OR: [{ slug: 'RE' }, { name: { contains: 'ใบเสร็จรับเงิน' } }], isGlobal: true },
  })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารใบเสร็จรับเงิน (RE) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-modern-receipt-template'
  const data = {
    name: 'ใบเสร็จรับเงิน สีเขียว / Modern Receipt',
    slug,
    description: 'เทมเพลตใบเสร็จรับเงิน A4 พร้อมข้อมูลบริษัท ลูกค้า ตารางรายการ ยอดรวม วิธีชำระเงิน และช่องลงนาม',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'ใบเสร็จรับเงิน', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
