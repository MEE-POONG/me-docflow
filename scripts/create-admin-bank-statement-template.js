const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'bank-statement-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `bank-statement-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 14,
    color: '#1f2937',
    ...extra,
  }
}

const green = '#008f4c'
const elements = [
  element('heading', 44, 28, 430, 28, 'รายการเดินบัญชีเงินฝากออมทรัพย์ (มีรายละเอียด)', { fontSize: 22, fontWeight: 'bold' }),
  element('text', 44, 58, 430, 18, 'K-DEPOSIT STATEMENT OF SAVING ACCOUNT WITH DETAIL', { fontSize: 12, fontWeight: 'bold' }),
  element('logo', 620, 24, 165, 58, '{{bank_logo}}', { objectFit: 'contain' }),
  element('text', 620, 82, 165, 20, '{{bank_name}}', { fontSize: 17, fontWeight: 'bold', color: green, textAlign: 'center' }),

  element('text', 44, 100, 190, 18, 'Ref. No. {{reference_no}}', { fontSize: 12 }),
  element('text', 350, 100, 100, 18, 'Page {{page_no}}', { fontSize: 12, textAlign: 'center' }),
  element('text', 44, 124, 410, 42, '{{account_owner_name}}\n{{account_owner_address}}', { fontSize: 13 }),

  element('box', 500, 104, 300, 118, '', { borderColor: '#4b5563', borderWidth: 1 }),
  element('text', 506, 110, 98, 18, 'Reference Code', { fontSize: 12, fontWeight: 'bold' }),
  element('text', 610, 110, 182, 18, '{{reference_code}}', { fontSize: 13 }),
  element('line', 500, 134, 300, 1),
  element('text', 506, 140, 98, 18, 'Account Number', { fontSize: 12, fontWeight: 'bold' }),
  element('text', 610, 140, 182, 18, '{{account_number}}', { fontSize: 13 }),
  element('line', 500, 164, 300, 1),
  element('text', 506, 170, 98, 18, 'Period', { fontSize: 12, fontWeight: 'bold' }),
  element('text', 610, 170, 182, 18, '{{period_start}} - {{period_end}}', { fontSize: 13 }),
  element('line', 500, 194, 300, 1),
  element('text', 506, 200, 98, 18, 'Owner Branch', { fontSize: 12, fontWeight: 'bold' }),
  element('text', 610, 200, 182, 18, '{{owner_branch}}', { fontSize: 13 }),

  element('text', 500, 232, 170, 18, 'ENDING BALANCE', { fontSize: 12, fontWeight: 'bold' }),
  element('text', 670, 232, 130, 18, '{{ending_balance}}', { fontSize: 13, fontWeight: 'bold', textAlign: 'right' }),
  element('line', 500, 254, 300, 1),
  element('text', 500, 260, 170, 18, 'TOTAL WITHDRAWAL {{withdrawal_count}} ITEMS', { fontSize: 12, fontWeight: 'bold' }),
  element('text', 670, 260, 130, 18, '{{total_withdrawal}}', { fontSize: 13, textAlign: 'right' }),
  element('line', 500, 282, 300, 1),
  element('text', 500, 288, 170, 18, 'TOTAL DEPOSIT {{deposit_count}} ITEMS', { fontSize: 12, fontWeight: 'bold' }),
  element('text', 670, 288, 130, 18, '{{total_deposit}}', { fontSize: 13, textAlign: 'right' }),

  element('barcode', 92, 250, 320, 48, '{{statement_barcode}}', { barcodeFormat: 'CODE128' }),
  element('table', 44, 316, 756, 242, '[รายการเดินบัญชี]', {
    fontSize: 12,
    tableColumns: [
      { label: 'Date', field: 'date', width: 58, align: 'center' },
      { label: 'Time / Eff.Date', field: 'time', width: 66, align: 'center' },
      { label: 'Descriptions', field: 'description', width: 168, align: 'left' },
      { label: 'Withdrawal / Deposit', field: 'transactionAmount', width: 125, align: 'right' },
      { label: 'Outstanding Balance', field: 'balance', width: 112, align: 'right' },
      { label: 'Channel', field: 'channel', width: 116, align: 'left' },
      { label: 'Details', field: 'details', width: 111, align: 'left' },
    ],
    tableRows: 12,
    tableHeaderBold: true,
    tableHeaderBg: '#e5e7eb',
  }),
  element('text', 44, 566, 230, 16, 'เอกสารฉบับนี้สร้างจากระบบอิเล็กทรอนิกส์', { fontSize: 11, color: '#6b7280' }),
  element('text', 570, 566, 230, 16, 'วันที่ออกรายงาน {{generated_date}}', { fontSize: 11, color: '#6b7280', textAlign: 'right' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { name: { contains: 'Statement' }, isGlobal: true },
  })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารรายงาน Statement จากธนาคารในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-bank-statement-template'
  const data = {
    name: 'รายการเดินบัญชีเงินฝาก / Bank Statement',
    slug,
    description: 'เทมเพลตรายการเดินบัญชีธนาคาร พร้อมข้อมูลบัญชี สรุปยอด บาร์โค้ด และตารางธุรกรรมโดยละเอียด',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'Bank Statement', order: 1, width: 842, height: 595, background: '#ffffff' }],
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
