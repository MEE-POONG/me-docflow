const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'cash-flow-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `cash-flow-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 13,
    color: '#273251',
    ...extra,
  }
}

const valueColumns = [
  { label: 'รายการ', field: 'description', width: 365, align: 'left' },
  { label: '{{current_period}}', field: 'current', width: 92, align: 'right' },
  { label: '{{previous_period}}', field: 'previous', width: 92, align: 'right' },
]

function statementTable(y, height, rows) {
  return element('table', 23, y, 549, height, '[ตารางงบกระแสเงินสด]', {
    fontSize: 10,
    tableColumns: valueColumns,
    tableData: rows,
    tableHeaderBold: true,
    tableHeaderBg: '#f5f5f8',
  })
}

const elements = [
  element('heading', 23, 22, 260, 30, 'งบกระแสเงินสด', { fontSize: 21, fontWeight: 'bold' }),
  element('heading', 23, 60, 320, 30, '{{company_name}}', { fontSize: 18, fontWeight: 'bold' }),
  element('text', 23, 92, 360, 22, 'สำหรับปีสิ้นสุดวันที่ {{statement_end_date}}', { fontSize: 13 }),
  element('text', 406, 60, 166, 22, 'หน่วย: บาท', { fontSize: 12, textAlign: 'right' }),
  element('line', 23, 124, 549, 1, '', { color: '#d5d8e0' }),

  element('heading', 23, 135, 400, 24, 'กระแสเงินสดจากกิจกรรมดำเนินงาน', { fontSize: 15, fontWeight: 'bold', color: '#5367d9' }),
  statementTable(160, 330, [
    ['กำไร (ขาดทุน) สุทธิ', '{{operating_profit_current}}', '{{operating_profit_previous}}'],
    ['รายการปรับปรุงกระทบกำไร (ขาดทุน) สุทธิเป็นเงินสดรับ (จ่าย)', '', ''],
    ['  ค่าเสื่อมราคาและค่าตัดจำหน่าย', '{{depreciation_current}}', '{{depreciation_previous}}'],
    ['  ต้นทุนทางการเงิน', '{{finance_cost_current}}', '{{finance_cost_previous}}'],
    ['สินทรัพย์หมุนเวียน (เพิ่มขึ้น) ลดลง', '', ''],
    ['  ลูกหนี้การค้า', '{{trade_receivable_current}}', '{{trade_receivable_previous}}'],
    ['  ลูกหนี้กิจการอื่น', '{{other_receivable_current}}', '{{other_receivable_previous}}'],
    ['  สินค้าคงเหลือ', '{{inventory_current}}', '{{inventory_previous}}'],
    ['  สินทรัพย์ทางภาษีและสินทรัพย์หมุนเวียนอื่น', '{{other_current_asset_current}}', '{{other_current_asset_previous}}'],
    ['หนี้สินหมุนเวียนเพิ่มขึ้น (ลดลง)', '', ''],
    ['  เจ้าหนี้การค้า', '{{trade_payable_current}}', '{{trade_payable_previous}}'],
    ['  เจ้าหนี้กิจการอื่น', '{{other_payable_current}}', '{{other_payable_previous}}'],
    ['  หนี้สินทางภาษีและหนี้สินหมุนเวียนอื่น', '{{other_current_liability_current}}', '{{other_current_liability_previous}}'],
    ['  เงินเดือน (จ่าย) รับจากกิจกรรมดำเนินงาน', '{{other_operating_current}}', '{{other_operating_previous}}'],
    ['กระแสเงินสดสุทธิได้มาจาก (ใช้ไปใน) กิจกรรมดำเนินงาน', '{{net_operating_current}}', '{{net_operating_previous}}'],
  ]),

  element('heading', 23, 500, 400, 24, 'กระแสเงินสดจากกิจกรรมลงทุน', { fontSize: 15, fontWeight: 'bold', color: '#5367d9' }),
  statementTable(525, 88, [
    ['เงินสดรับจากการขายอาคารและอุปกรณ์', '{{asset_sale_current}}', '{{asset_sale_previous}}'],
    ['เงินสดจ่ายเพื่อซื้ออาคารและอุปกรณ์', '{{asset_purchase_current}}', '{{asset_purchase_previous}}'],
    ['กระแสเงินสดสุทธิได้มาจาก (ใช้ไปใน) กิจกรรมลงทุน', '{{net_investing_current}}', '{{net_investing_previous}}'],
  ]),

  element('heading', 23, 620, 400, 24, 'กระแสเงินสดจากกิจกรรมจัดหาเงิน', { fontSize: 15, fontWeight: 'bold', color: '#5367d9' }),
  statementTable(645, 112, [
    ['เงินสดรับจากเงินทุน', '{{capital_current}}', '{{capital_previous}}'],
    ['ชำระคืนเงินกู้ยืม', '{{loan_repayment_current}}', '{{loan_repayment_previous}}'],
    ['ดอกเบี้ยจ่าย', '{{interest_paid_current}}', '{{interest_paid_previous}}'],
    ['เงินปันผลจ่าย', '{{dividend_paid_current}}', '{{dividend_paid_previous}}'],
    ['กระแสเงินสดสุทธิได้มาจาก (ใช้ไปใน) กิจกรรมจัดหาเงิน', '{{net_financing_current}}', '{{net_financing_previous}}'],
  ]),

  element('table', 23, 767, 549, 62, '[สรุปเงินสด]', {
    fontSize: 10,
    tableColumns: valueColumns,
    tableData: [
      ['เงินสดและรายการเทียบเท่าเงินสดเพิ่มขึ้น (ลดลง) สุทธิ', '{{net_cash_change_current}}', '{{net_cash_change_previous}}'],
      ['เงินสดและรายการเทียบเท่าเงินสดต้นงวด', '{{cash_beginning_current}}', '{{cash_beginning_previous}}'],
      ['เงินสดและรายการเทียบเท่าเงินสดปลายงวด', '{{cash_ending_current}}', '{{cash_ending_previous}}'],
    ],
    tableHeaderBold: false,
    tableHeaderBg: '#f5f5f8',
  }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'F/S', isGlobal: true },
  })

  if (!documentType) throw new Error('ไม่พบประเภทเอกสารงบการเงิน (F/S) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-cash-flow-statement-template'
  const data = {
    name: 'งบกระแสเงินสดมาตรฐาน',
    slug,
    description: 'เทมเพลตงบกระแสเงินสดเปรียบเทียบ 2 งวด แยกกิจกรรมดำเนินงาน กิจกรรมลงทุน กิจกรรมจัดหาเงิน และสรุปเงินสดปลายงวด',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'งบกระแสเงินสด', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
