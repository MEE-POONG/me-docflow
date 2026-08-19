const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'payment-voucher-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `payment-voucher-${sequence}`,
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

const elements = [
  element('heading', 185, 25, 472, 34, '{{company_name}}', { fontSize: 24, fontWeight: 'bold', textAlign: 'center' }),
  element('heading', 80, 72, 220, 30, 'ใบสำคัญจ่าย', { fontSize: 22, fontWeight: 'bold', color: '#2f7f9f' }),
  element('heading', 80, 102, 220, 26, 'PAYMENT VOUCHER', { fontSize: 18, color: '#2f7f9f' }),
  element('text', 650, 73, 64, 22, 'เลขที่', { fontSize: 15 }),
  element('text', 714, 73, 92, 22, '{{doc_no}}', { fontSize: 15, fontWeight: 'bold', textAlign: 'center' }),
  element('line', 714, 98, 92, 1),
  element('text', 650, 105, 64, 22, 'วันที่', { fontSize: 15 }),
  element('text', 714, 105, 92, 22, '{{doc_date}}', { fontSize: 15, textAlign: 'center' }),
  element('line', 714, 130, 92, 1),

  element('text', 80, 151, 85, 24, 'จ่ายให้แก่', { fontSize: 16 }),
  element('text', 165, 151, 415, 24, '{{payee_name}}', { fontSize: 16, fontWeight: 'bold' }),
  element('line', 165, 178, 415, 1),

  element('text', 88, 191, 210, 24, '□ เงินสด     □ โอน     □ เช็คธนาคาร', { fontSize: 16 }),
  element('text', 305, 191, 80, 24, 'ธนาคาร', { fontSize: 15 }),
  element('text', 375, 191, 110, 24, '{{bank_name}}', { fontSize: 15 }),
  element('line', 375, 218, 110, 1),
  element('text', 500, 191, 55, 24, 'สาขา', { fontSize: 15 }),
  element('text', 555, 191, 100, 24, '{{bank_branch}}', { fontSize: 15 }),
  element('line', 555, 218, 100, 1),
  element('text', 668, 191, 64, 24, 'เลขที่เช็ค', { fontSize: 15 }),
  element('text', 732, 191, 74, 24, '{{cheque_no}}', { fontSize: 15 }),
  element('line', 732, 218, 74, 1),
  element('text', 88, 226, 90, 24, 'เช็คลงวันที่', { fontSize: 15 }),
  element('text', 178, 226, 120, 24, '{{cheque_date}}', { fontSize: 15 }),
  element('line', 178, 253, 120, 1),
  element('text', 310, 226, 75, 24, 'จำนวนเงิน', { fontSize: 15 }),
  element('text', 385, 226, 100, 24, '{{net_amount}}', { fontSize: 16, fontWeight: 'bold', textAlign: 'right' }),
  element('line', 385, 253, 100, 1),

  element('table', 70, 260, 736, 150, '[รายการเอกสารประกอบการจ่าย]', {
    fontSize: 13,
    tableColumns: [
      { label: 'วันที่เอกสาร', field: 'date', width: 100, align: 'center' },
      { label: 'เลขที่เอกสาร', field: 'documentNo', width: 125, align: 'center' },
      { label: 'รายการ / Description', field: 'description', width: 376, align: 'left' },
      { label: 'จำนวนเงิน', field: 'amount', width: 135, align: 'right' },
    ],
    tableRows: 5,
    tableHeaderBold: true,
    tableHeaderBg: '#f5f5f5',
  }),

  element('text', 70, 420, 98, 22, 'หมายเหตุ:', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 168, 420, 385, 22, '{{remarks}}', { fontSize: 14 }),
  element('text', 555, 420, 116, 22, 'จำนวนเงินรวม', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 671, 420, 135, 22, '{{subtotal}}', { fontSize: 15, textAlign: 'right' }),
  element('text', 555, 444, 116, 22, 'หัก ณ ที่จ่าย {{withholding_percent}}%', { fontSize: 14 }),
  element('text', 671, 444, 135, 22, '{{withholding_tax}}', { fontSize: 15, textAlign: 'right' }),
  element('text', 555, 468, 116, 22, 'คงเหลือสุทธิ', { fontSize: 15, fontWeight: 'bold' }),
  element('text', 671, 468, 135, 22, '{{net_amount}}', { fontSize: 16, fontWeight: 'bold', textAlign: 'right', color: '#b91c1c' }),
  element('text', 70, 492, 90, 22, 'จำนวนเงิน', { fontSize: 15, fontWeight: 'bold' }),
  element('text', 160, 492, 380, 22, '{{total_amount_text}}', { fontSize: 15, fontWeight: 'bold' }),
  element('line', 70, 518, 736, 1),

  element('line', 80, 548, 145, 1),
  element('line', 265, 548, 145, 1),
  element('line', 450, 548, 145, 1),
  element('line', 635, 548, 145, 1),
  element('text', 80, 558, 145, 18, 'ผู้จ่าย', { fontSize: 14, textAlign: 'center' }),
  element('text', 265, 558, 145, 18, 'ผู้ตรวจสอบ', { fontSize: 14, textAlign: 'center' }),
  element('text', 450, 558, 145, 18, 'ผู้อนุมัติ', { fontSize: 14, textAlign: 'center' }),
  element('text', 635, 558, 145, 18, 'ผู้รับเงิน', { fontSize: 14, textAlign: 'center' }),
  element('text', 80, 578, 145, 16, 'วันที่ {{payer_date}}', { fontSize: 12, textAlign: 'center' }),
  element('text', 265, 578, 145, 16, 'วันที่ {{reviewer_date}}', { fontSize: 12, textAlign: 'center' }),
  element('text', 450, 578, 145, 16, 'วันที่ {{approver_date}}', { fontSize: 12, textAlign: 'center' }),
  element('text', 635, 578, 145, 16, 'วันที่ {{recipient_date}}', { fontSize: 12, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'PAY', isGlobal: true },
  })

  if (!documentType) throw new Error('ไม่พบประเภทเอกสารใบสำคัญจ่าย (PAY) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-payment-voucher-template'
  const data = {
    name: 'ใบสำคัญจ่าย / Payment Voucher',
    slug,
    description: 'เทมเพลตใบสำคัญจ่ายแนวนอน พร้อมผู้รับเงิน วิธีชำระ เช็คธนาคาร รายการเอกสาร ภาษีหัก ณ ที่จ่าย ยอดสุทธิ และช่องลงนาม',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'ใบสำคัญจ่าย', order: 1, width: 842, height: 595, background: '#ffffff' }],
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
