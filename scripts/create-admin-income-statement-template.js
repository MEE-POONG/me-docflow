const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'income-statement-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `income-statement-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 13,
    color: '#1f2937',
    ...extra,
  }
}

const columns = [
  { label: 'รายการ', field: 'description', width: 285, align: 'left' },
  { label: '{{current_period}}', field: 'current', width: 98, align: 'right' },
  { label: '{{previous_period}}', field: 'previous', width: 98, align: 'right' },
  { label: 'เปลี่ยนแปลง', field: 'change', width: 68, align: 'right' },
]

function statementTable(y, height, rows) {
  return element('table', 23, y, 549, height, '[ตารางงบกำไรขาดทุน]', {
    fontSize: 10,
    tableColumns: columns,
    tableData: rows,
    tableHeaderBold: true,
    tableHeaderBg: '#f4f6f7',
  })
}

const elements = [
  element('heading', 23, 22, 549, 28, '{{company_name}}', { fontSize: 18, fontWeight: 'bold', textAlign: 'center' }),
  element('heading', 23, 52, 549, 28, 'งบกำไรขาดทุนเปรียบเทียบ', { fontSize: 18, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 23, 80, 549, 22, 'สำหรับปีสิ้นสุดวันที่ {{statement_end_date}}', { fontSize: 13, textAlign: 'center' }),
  element('text', 420, 106, 152, 20, 'หน่วย: บาท', { fontSize: 11, textAlign: 'right' }),
  element('line', 23, 130, 549, 1, '', { color: '#1596ad' }),

  element('heading', 23, 140, 260, 22, 'รายได้', { fontSize: 15, fontWeight: 'bold' }),
  statementTable(163, 152, [
    ['รายได้หลัก', '', '', ''],
    ['  รายได้จากการขายสินค้า', '{{sales_revenue_current}}', '{{sales_revenue_previous}}', '{{sales_revenue_change}}'],
    ['  รายได้จากการให้บริการ', '{{service_revenue_current}}', '{{service_revenue_previous}}', '{{service_revenue_change}}'],
    ['  รวมรายได้หลัก', '{{main_revenue_current}}', '{{main_revenue_previous}}', '{{main_revenue_change}}'],
    ['รายได้อื่น', '', '', ''],
    ['  กำไรจากการขายทรัพย์สินและรายได้อื่น', '{{other_revenue_current}}', '{{other_revenue_previous}}', '{{other_revenue_change}}'],
    ['รวมรายได้', '{{total_revenue_current}}', '{{total_revenue_previous}}', '{{total_revenue_change}}'],
  ]),

  element('heading', 23, 325, 260, 22, 'ค่าใช้จ่าย', { fontSize: 15, fontWeight: 'bold' }),
  statementTable(348, 340, [
    ['ค่าใช้จ่ายหลัก', '', '', ''],
    ['  ต้นทุนขายสินค้า', '{{cost_of_goods_current}}', '{{cost_of_goods_previous}}', '{{cost_of_goods_change}}'],
    ['  ต้นทุนการให้บริการ', '{{service_cost_current}}', '{{service_cost_previous}}', '{{service_cost_change}}'],
    ['  รวมต้นทุนขาย', '{{total_cost_current}}', '{{total_cost_previous}}', '{{total_cost_change}}'],
    ['ค่าใช้จ่ายในการขาย', '', '', ''],
    ['  ค่าขนส่งและค่าบริการ', '{{selling_expense_current}}', '{{selling_expense_previous}}', '{{selling_expense_change}}'],
    ['ค่าใช้จ่ายในการบริหาร', '', '', ''],
    ['  ค่าใช้จ่ายเกี่ยวกับพนักงาน', '{{staff_expense_current}}', '{{staff_expense_previous}}', '{{staff_expense_change}}'],
    ['  ค่ารับรองและค่าใช้จ่ายสำนักงาน', '{{office_expense_current}}', '{{office_expense_previous}}', '{{office_expense_change}}'],
    ['  ค่าเสื่อมราคาและค่าตัดจำหน่าย', '{{depreciation_current}}', '{{depreciation_previous}}', '{{depreciation_change}}'],
    ['  ค่าใช้จ่ายอื่นในการบริหาร', '{{other_admin_expense_current}}', '{{other_admin_expense_previous}}', '{{other_admin_expense_change}}'],
    ['  รวมค่าใช้จ่ายในการบริหาร', '{{total_admin_expense_current}}', '{{total_admin_expense_previous}}', '{{total_admin_expense_change}}'],
    ['ค่าใช้จ่ายอื่น', '', '', ''],
    ['  ดอกเบี้ยจ่าย', '{{interest_expense_current}}', '{{interest_expense_previous}}', '{{interest_expense_change}}'],
    ['  ภาษีเงินได้', '{{income_tax_current}}', '{{income_tax_previous}}', '{{income_tax_change}}'],
    ['รวมค่าใช้จ่าย', '{{total_expense_current}}', '{{total_expense_previous}}', '{{total_expense_change}}'],
  ]),

  element('table', 23, 700, 549, 115, '[สรุปผลประกอบการ]', {
    fontSize: 11,
    tableColumns: columns,
    tableData: [
      ['กำไรขั้นต้น', '{{gross_profit_current}}', '{{gross_profit_previous}}', '{{gross_profit_change}}'],
      ['กำไรก่อนดอกเบี้ยและภาษี', '{{ebit_current}}', '{{ebit_previous}}', '{{ebit_change}}'],
      ['กำไรก่อนภาษีเงินได้', '{{profit_before_tax_current}}', '{{profit_before_tax_previous}}', '{{profit_before_tax_change}}'],
      ['กำไรสุทธิ', '{{net_profit_current}}', '{{net_profit_previous}}', '{{net_profit_change}}'],
    ],
    tableHeaderBold: false,
    tableHeaderBg: '#eef7f8',
  }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'F/S', isGlobal: true },
  })

  if (!documentType) throw new Error('ไม่พบประเภทเอกสารงบการเงิน (F/S) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-comparative-income-statement-template'
  const data = {
    name: 'งบกำไรขาดทุนเปรียบเทียบ',
    slug,
    description: 'เทมเพลตงบกำไรขาดทุนเปรียบเทียบ 2 งวด พร้อมเปอร์เซ็นต์เปลี่ยนแปลง แยกรายได้ ต้นทุนขาย ค่าใช้จ่าย และสรุปกำไรสุทธิ',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'งบกำไรขาดทุน', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
