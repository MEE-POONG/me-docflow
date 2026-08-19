const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()

const pageId = 'payslip-page-1'
let elementSequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  elementSequence += 1
  return {
    id: `payslip-${elementSequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 15,
    color: '#273251',
    ...extra,
  }
}

const elements = [
  element('heading', 22, 20, 70, 38, 'BAU', { fontSize: 30, fontWeight: 'bold', color: '#111827' }),
  element('heading', 98, 20, 480, 30, '{{company_name}} (Tax ID : {{company_taxid}})', { fontSize: 20, fontWeight: 'bold' }),
  element('heading', 655, 20, 165, 30, 'สลิปเงินเดือน/PaySlip', { fontSize: 20, fontWeight: 'bold', textAlign: 'left' }),

  element('text', 98, 52, 100, 22, 'ข้อมูลพนักงาน', { fontSize: 15, fontWeight: 'bold' }),
  element('text', 98, 75, 110, 22, 'ชื่อ-นามสกุล (รหัส)', { fontSize: 14 }),
  element('text', 210, 75, 350, 22, ': {{employee_name}} ({{employee_code}})', { fontSize: 14 }),
  element('text', 98, 97, 110, 22, 'แผนก', { fontSize: 14 }),
  element('text', 210, 97, 350, 22, ': {{department}}', { fontSize: 14 }),
  element('text', 98, 119, 110, 22, 'ตำแหน่ง', { fontSize: 14 }),
  element('text', 210, 119, 350, 22, ': {{employee_position}}', { fontSize: 14 }),
  element('text', 98, 141, 110, 22, 'รับเงินโดย', { fontSize: 14 }),
  element('text', 210, 141, 350, 22, ': {{payment_method}}', { fontSize: 14 }),

  element('text', 655, 54, 165, 22, 'รอบเงินเดือน', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 655, 78, 72, 22, 'ตั้งแต่วันที่', { fontSize: 14 }),
  element('text', 728, 78, 92, 22, ': {{period_start}}', { fontSize: 14 }),
  element('text', 655, 100, 72, 22, 'ถึงวันที่', { fontSize: 14 }),
  element('text', 728, 100, 92, 22, ': {{period_end}}', { fontSize: 14 }),
  element('text', 655, 122, 72, 22, 'วันที่ชำระเงินเดือน', { fontSize: 13 }),
  element('text', 750, 122, 70, 22, ': {{payment_date}}', { fontSize: 13 }),

  element('line', 20, 166, 802, 2, '', { color: '#c7cad2' }),
  element('heading', 20, 178, 350, 28, 'รายการเงินเดือน : {{payroll_period}}', { fontSize: 19, fontWeight: 'bold' }),

  element('table', 20, 212, 802, 205, '[ตารางรายได้และรายการหัก]', {
    fontSize: 14,
    tableColumns: [
      { label: 'รายได้', field: 'income_name', width: 295, align: 'left' },
      { label: 'จำนวนเงิน (บาท)', field: 'income_amount', width: 105, align: 'right' },
      { label: 'รายการหัก', field: 'deduction_name', width: 295, align: 'left' },
      { label: 'จำนวนเงิน (บาท)', field: 'deduction_amount', width: 105, align: 'right' },
    ],
    tableData: [
      ['เงินเดือน', '{{salary}}', 'กองทุนสำรองเลี้ยงชีพ', '{{provident_fund}}'],
      ['', '', 'ภาษีหัก ณ ที่จ่าย', '{{withholding_tax}}'],
      ['', '', '', ''],
      ['', '', '', ''],
      ['รายได้รวม', '{{total_income}}', 'รายการหัก', '{{total_deduction}}'],
      ['', '', 'เงินรับสุทธิ', '{{net_income}}'],
    ],
    tableHeaderBold: true,
    tableHeaderBg: '#f4f4f5',
  }),

  element('heading', 20, 438, 280, 28, 'รวมเงินได้ทั้งปี : {{tax_year}}', { fontSize: 19, fontWeight: 'bold' }),
  element('table', 20, 474, 802, 80, '[ตารางยอดสะสม]', {
    fontSize: 13,
    tableColumns: [
      { label: 'เงินได้สะสม (บาท)', field: 'ytd_income', width: 160, align: 'center' },
      { label: 'ภาษีหัก ณ ที่จ่าย สะสม (บาท)', field: 'ytd_tax', width: 160, align: 'center' },
      { label: 'เงินประกันสังคมสะสม (บาท)', field: 'ytd_social_security', width: 160, align: 'center' },
      { label: 'เงินกองทุนสำรองฯสะสม (บาท)', field: 'ytd_provident_fund', width: 160, align: 'center' },
      { label: 'ลายเซ็นผู้รับเงิน', field: 'signature', width: 162, align: 'center' },
    ],
    tableData: [['{{ytd_income}}', '{{ytd_tax}}', '{{ytd_social_security}}', '{{ytd_provident_fund}}', '']],
    tableHeaderBold: true,
    tableHeaderBg: '#f4f4f5',
  }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'PAYSL', isGlobal: true },
  })

  if (!documentType) {
    throw new Error('ไม่พบประเภทเอกสารสลิปเงินเดือน (PAYSL) ในระบบ')
  }

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-payslip-template-05'
  const data = {
    name: 'สลิปเงินเดือนมาตรฐาน 05',
    slug,
    description: 'เทมเพลตสลิปเงินเดือนแนวนอน อ้างอิงจากแบบฟอร์มสลิปเงินเดือน05 พร้อมข้อมูลพนักงาน รายได้ รายการหัก ยอดสุทธิ ยอดสะสม และช่องลงลายมือชื่อ',
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
