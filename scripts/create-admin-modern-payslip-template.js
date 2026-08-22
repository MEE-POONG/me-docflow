const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'modern-payslip-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `modern-payslip-${sequence}`,
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

const blue = '#2f9fce'
const elements = [
  element('heading', 44, 28, 350, 28, '{{company_name}}', { fontSize: 21, fontWeight: 'bold' }),
  element('text', 44, 58, 350, 38, '{{company_address}}', { fontSize: 13 }),
  element('logo', 390, 28, 135, 55, '{{company_logo}}', { objectFit: 'contain' }),
  element('heading', 550, 28, 245, 30, 'สลิปเงินเดือน / Pay Slip', { fontSize: 21, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 550, 62, 245, 18, 'รอบเงินเดือน {{pay_period}}', { fontSize: 14, textAlign: 'right' }),
  element('text', 550, 84, 245, 18, 'วันที่ชำระ {{payment_date}}', { fontSize: 14, textAlign: 'right' }),
  element('text', 550, 106, 245, 18, 'เลขที่บัญชี {{bank_account}}', { fontSize: 14, textAlign: 'right' }),
  element('line', 44, 132, 751, 2, '', { color: blue }),

  element('text', 44, 146, 92, 18, 'ชื่อพนักงาน', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 138, 146, 245, 18, '{{employee_name}} ({{employee_code}})', { fontSize: 15 }),
  element('text', 44, 170, 92, 18, 'ตำแหน่ง', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 138, 170, 245, 18, '{{position}}', { fontSize: 14 }),
  element('text', 405, 146, 92, 18, 'แผนก', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 499, 146, 160, 18, '{{department}}', { fontSize: 14 }),
  element('text', 405, 170, 92, 18, 'รหัสภาษี', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 499, 170, 160, 18, '{{employee_tax_id}}', { fontSize: 14 }),

  element('table', 44, 206, 245, 236, '[รายการเงินได้]', {
    fontSize: 13,
    tableColumns: [
      { label: 'เงินได้ / Earnings', field: 'name', width: 155, align: 'left' },
      { label: 'จำนวนเงิน', field: 'amount', width: 90, align: 'right' },
    ],
    tableRows: 8,
    tableHeaderBold: true,
    tableHeaderBg: '#eef8fc',
  }),
  element('table', 299, 206, 245, 236, '[รายการหัก]', {
    fontSize: 13,
    tableColumns: [
      { label: 'รายการหัก / Deductions', field: 'name', width: 155, align: 'left' },
      { label: 'จำนวนเงิน', field: 'amount', width: 90, align: 'right' },
    ],
    tableRows: 8,
    tableHeaderBold: true,
    tableHeaderBg: '#f8fafc',
  }),
  element('table', 554, 206, 241, 165, '[ยอดสะสมประจำปี]', {
    fontSize: 13,
    tableColumns: [
      { label: 'ปี {{tax_year}} / YTD', field: 'name', width: 151, align: 'left' },
      { label: 'ยอดสะสม', field: 'amount', width: 90, align: 'right' },
    ],
    tableRows: 5,
    tableHeaderBold: true,
    tableHeaderBg: '#eef8fc',
  }),

  element('text', 554, 382, 150, 20, 'รวมเงินได้ / Total earnings', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 704, 382, 91, 20, '{{total_earnings}}', { fontSize: 15, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 554, 406, 150, 20, 'รวมรายการหัก / Total deductions', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 704, 406, 91, 20, '{{total_deductions}}', { fontSize: 15, fontWeight: 'bold', textAlign: 'right' }),
  element('box', 554, 434, 241, 44, '', { backgroundColor: '#eef8fc', borderColor: blue, borderWidth: 1 }),
  element('text', 566, 445, 125, 22, 'เงินได้สุทธิ / Net pay', { fontSize: 16, fontWeight: 'bold', color: blue }),
  element('text', 691, 445, 92, 22, '{{net_pay}}', { fontSize: 19, fontWeight: 'bold', textAlign: 'right', color: blue }),

  element('text', 44, 462, 78, 18, 'หมายเหตุ', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 124, 462, 390, 36, '{{remarks}}', { fontSize: 13 }),
  element('text', 554, 492, 110, 18, 'ลายเซ็นผู้จ่ายเงิน', { fontSize: 13 }),
  element('line', 666, 510, 129, 1),
  element('text', 666, 516, 129, 18, '{{employer_signature}}', { fontSize: 12, textAlign: 'center' }),
  element('line', 44, 544, 751, 1, '', { color: '#9ca3af' }),
  element('text', 44, 552, 751, 26, 'ข้อมูลเงินเดือนและค่าจ้างเป็นข้อมูลส่วนบุคคล ห้ามเปิดเผยโดยไม่ได้รับอนุญาต\nSalary and wages are confidential information.', { fontSize: 11, textAlign: 'center', color: '#6b7280' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'PAYSL', isGlobal: true },
  })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารสลิปเงินเดือน (PAYSL) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-modern-payslip-template-v2'
  const data = {
    name: 'สลิปเงินเดือน สรุปรายได้และยอดสะสม / Modern Payslip',
    slug,
    description: 'เทมเพลตสลิปเงินเดือนแนวนอน พร้อมข้อมูลพนักงาน เงินได้ รายการหัก ยอดสะสมประจำปี และเงินได้สุทธิ',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'สลิปเงินเดือน', order: 1, width: 842, height: 595, background: '#ffffff' }],
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
