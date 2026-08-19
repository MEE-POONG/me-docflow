const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'receipt-voucher-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `receipt-voucher-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 15,
    color: '#111827',
    ...extra,
  }
}

const pink = '#f2b6cf'
const elements = [
  element('heading', 236, 20, 370, 34, 'ใบสำคัญรับ', { fontSize: 27, fontWeight: 'bold', textAlign: 'center' }),
  element('heading', 236, 54, 370, 28, 'RECEIPT VOUCHER', { fontSize: 22, fontWeight: 'bold', textAlign: 'center' }),
  element('box', 650, 20, 150, 62, '', { borderColor: '#374151', borderWidth: 1, backgroundColor: '#ffffff' }),
  element('box', 650, 20, 64, 31, '', { borderColor: '#374151', borderWidth: 1, backgroundColor: pink }),
  element('box', 650, 51, 64, 31, '', { borderColor: '#374151', borderWidth: 1, backgroundColor: pink }),
  element('text', 656, 26, 54, 18, 'เลขที่  No.', { fontSize: 13, textAlign: 'center' }),
  element('text', 718, 26, 78, 18, '{{doc_no}}', { fontSize: 14, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 656, 57, 54, 18, 'วันที่  Date', { fontSize: 13, textAlign: 'center' }),
  element('text', 718, 57, 78, 18, '{{doc_date}}', { fontSize: 14, textAlign: 'center' }),

  element('box', 42, 96, 758, 120, '', { borderColor: '#374151', borderWidth: 1, borderRadius: 8 }),
  element('text', 54, 108, 92, 20, 'รับจาก / Received from', { fontSize: 14 }),
  element('text', 150, 108, 630, 20, '{{received_from}}', { fontSize: 15, fontWeight: 'bold' }),
  element('line', 150, 130, 630, 1),
  element('text', 54, 140, 75, 42, 'โดย / BY :', { fontSize: 14 }),
  element('text', 128, 140, 168, 42, '□ เงินสด / Cash     □ เช็คธนาคาร / Bank', { fontSize: 14 }),
  element('text', 310, 140, 65, 20, 'เลขที่เช็ค', { fontSize: 13 }),
  element('text', 375, 140, 120, 20, '{{cheque_no}}', { fontSize: 14 }),
  element('line', 375, 162, 120, 1),
  element('text', 510, 140, 70, 20, 'ลงวันที่', { fontSize: 13 }),
  element('text', 580, 140, 105, 20, '{{cheque_date}}', { fontSize: 14 }),
  element('line', 580, 162, 105, 1),
  element('text', 54, 184, 135, 20, 'เพื่อรับชำระ / Received for', { fontSize: 14 }),
  element('text', 190, 184, 280, 20, '{{received_for}}', { fontSize: 14 }),
  element('line', 190, 206, 280, 1),
  element('text', 486, 184, 55, 20, 'อื่น ๆ', { fontSize: 13 }),
  element('text', 541, 184, 239, 20, '{{other_details}}', { fontSize: 14 }),
  element('line', 541, 206, 239, 1),

  element('table', 42, 230, 758, 250, '[รายการรับเงิน]', {
    fontSize: 13,
    tableColumns: [
      { label: 'ชื่อบัญชี / Account', field: 'account', width: 120, align: 'left' },
      { label: 'เลขที่บิล / No.', field: 'billNo', width: 120, align: 'center' },
      { label: 'รายการ / Particulars', field: 'particulars', width: 375, align: 'left' },
      { label: 'จำนวนเงิน / Amount', field: 'amount', width: 143, align: 'right' },
    ],
    tableRows: 7,
    tableHeaderBold: true,
    tableHeaderBg: pink,
  }),

  element('text', 52, 486, 150, 18, 'จำนวนเงินเป็นตัวอักษร', { fontSize: 13 }),
  element('text', 202, 486, 365, 18, '{{total_amount_text}}', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 580, 486, 90, 18, 'รวม / Total', { fontSize: 15, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 680, 486, 110, 18, '{{total_amount}}', { fontSize: 16, fontWeight: 'bold', textAlign: 'right' }),

  element('box', 42, 515, 758, 70, '', { borderColor: '#374151', borderWidth: 1, borderRadius: 6 }),
  element('text', 54, 526, 82, 18, 'ผู้จัดทำ', { fontSize: 13 }),
  element('text', 136, 526, 210, 18, '{{prepared_by}}', { fontSize: 14 }),
  element('line', 136, 547, 210, 1),
  element('text', 424, 526, 82, 18, 'ผู้อนุมัติ', { fontSize: 13 }),
  element('text', 506, 526, 274, 18, '{{authorized_by}}', { fontSize: 14 }),
  element('line', 506, 547, 274, 1),
  element('text', 54, 554, 82, 18, 'ผู้ตรวจ', { fontSize: 13 }),
  element('text', 136, 554, 210, 18, '{{checked_by}}', { fontSize: 14 }),
  element('line', 136, 575, 210, 1),
  element('text', 424, 554, 82, 18, 'ผู้รับเงิน', { fontSize: 13 }),
  element('text', 506, 554, 274, 18, '{{received_by}}', { fontSize: 14 }),
  element('line', 506, 575, 274, 1),
  element('text', 54, 578, 350, 15, 'เอกสารแนบ  □ ใบเสร็จรับเงิน  {{receipt_count}} ฉบับ', { fontSize: 12 }),
  element('text', 430, 578, 350, 15, '□ อื่น ๆ  {{attachment_others}}', { fontSize: 12 }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { OR: [{ slug: 'RECEI' }, { name: { contains: 'ใบสำคัญรับ' } }], isGlobal: true },
  })

  if (!documentType) throw new Error('ไม่พบประเภทเอกสารใบสำคัญรับในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-receipt-voucher-template'
  const data = {
    name: 'ใบสำคัญรับ / Receipt Voucher',
    slug,
    description: 'เทมเพลตใบสำคัญรับแนวนอน พร้อมข้อมูลผู้ชำระ วิธีรับเงิน เช็คธนาคาร ตารางบัญชี ยอดรวม เอกสารแนบ และช่องลงนาม',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'ใบสำคัญรับ', order: 1, width: 842, height: 595, background: '#ffffff' }],
      elements,
    },
    paperSize: PaperSize.A4,
    orientation: PaperOrientation.LANDSCAPE,
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
