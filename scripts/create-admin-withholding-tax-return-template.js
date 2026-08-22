const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'withholding-tax-return-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `withholding-tax-return-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 12,
    color: '#17324d',
    ...extra,
  }
}

const border = '#6baeb8'
const pale = '#e8f7f8'
const elements = [
  element('box', 24, 20, 547, 75, '', { backgroundColor: pale, borderColor: border, borderWidth: 1, borderRadius: 8 }),
  element('heading', 42, 31, 365, 22, 'กรมสรรพากร', { fontSize: 16, fontWeight: 'bold' }),
  element('text', 42, 53, 365, 18, 'แบบยื่นรายการภาษีเงินได้หัก ณ ที่จ่าย', { fontSize: 13 }),
  element('heading', 430, 30, 118, 43, '{{form_type}}', { fontSize: 25, fontWeight: 'bold', textAlign: 'center', color: '#167a88' }),
  element('text', 430, 70, 118, 16, 'ภ.ง.ด.1 / 3 / 53', { fontSize: 10, textAlign: 'center' }),

  element('checkbox', 36, 108, 16, 16, '{{is_pnd1}}'),
  element('text', 58, 106, 94, 20, 'ภ.ง.ด.1', { fontWeight: 'bold' }),
  element('checkbox', 174, 108, 16, 16, '{{is_pnd3}}'),
  element('text', 196, 106, 94, 20, 'ภ.ง.ด.3', { fontWeight: 'bold' }),
  element('checkbox', 312, 108, 16, 16, '{{is_pnd53}}'),
  element('text', 334, 106, 100, 20, 'ภ.ง.ด.53', { fontWeight: 'bold' }),
  element('checkbox', 448, 108, 16, 16, '{{is_normal_filing}}'),
  element('text', 470, 106, 83, 20, 'ยื่นปกติ', { fontWeight: 'bold' }),

  element('box', 24, 135, 547, 172, '', { borderColor: border, borderWidth: 1, borderRadius: 6 }),
  element('heading', 36, 145, 523, 21, 'ข้อมูลผู้มีหน้าที่หักภาษี ณ ที่จ่าย', { fontSize: 14, fontWeight: 'bold', color: '#167a88' }),
  element('text', 36, 174, 270, 19, 'เลขประจำตัวผู้เสียภาษี: {{tax_id}}'),
  element('text', 324, 174, 235, 19, 'สาขาที่: {{branch_number}}'),
  element('text', 36, 199, 523, 19, 'ชื่อผู้มีหน้าที่หักภาษี: {{withholding_agent_name}}'),
  element('text', 36, 224, 523, 35, 'ที่อยู่: {{withholding_agent_address}}', { textAlign: 'left' }),
  element('text', 36, 266, 270, 19, 'โทรศัพท์: {{phone}}'),
  element('text', 324, 266, 235, 19, 'อีเมล: {{email}}'),

  element('box', 24, 319, 547, 80, '', { borderColor: border, borderWidth: 1, borderRadius: 6 }),
  element('heading', 36, 329, 523, 20, 'งวดภาษีและการยื่นแบบ', { fontSize: 14, fontWeight: 'bold', color: '#167a88' }),
  element('text', 36, 358, 190, 19, 'เดือนภาษี: {{tax_month}}'),
  element('text', 226, 358, 120, 19, 'ปีภาษี: {{tax_year}}'),
  element('checkbox', 360, 359, 16, 16, '{{is_additional_filing}}'),
  element('text', 382, 357, 91, 20, 'ยื่นเพิ่มเติม'),
  element('text', 475, 357, 83, 20, 'ครั้งที่ {{filing_no}}'),

  element('table', 24, 412, 547, 191, '[สรุปรายการภาษีหัก ณ ที่จ่าย]', {
    fontSize: 10,
    tableColumns: [
      { label: 'ประเภทเงินได้/แบบแนบ', field: 'incomeType', width: 225, align: 'left' },
      { label: 'จำนวนผู้มีเงินได้', field: 'payeeCount', width: 92, align: 'center' },
      { label: 'จำนวนเงินได้ (บาท)', field: 'incomeAmount', width: 115, align: 'right' },
      { label: 'ภาษีที่นำส่ง (บาท)', field: 'taxAmount', width: 115, align: 'right' },
    ],
    tableRows: 5,
    tableHeaderBold: true,
    tableHeaderBg: pale,
    borderColor: border,
  }),

  element('box', 24, 616, 547, 112, '', { borderColor: border, borderWidth: 1, borderRadius: 6 }),
  element('heading', 36, 626, 280, 20, 'สรุปรายการภาษีที่นำส่ง', { fontSize: 14, fontWeight: 'bold', color: '#167a88' }),
  element('text', 36, 653, 330, 18, 'จำนวนแบบแนบทั้งหมด: {{attachment_sheets}} แผ่น'),
  element('text', 36, 677, 330, 18, 'จำนวนผู้มีเงินได้ทั้งหมด: {{total_payees}} ราย'),
  element('text', 374, 629, 181, 18, 'รวมเงินได้: {{total_income}}', { textAlign: 'right' }),
  element('text', 374, 653, 181, 18, 'รวมภาษีหัก ณ ที่จ่าย: {{total_tax}}', { textAlign: 'right' }),
  element('text', 374, 677, 181, 18, 'เงินเพิ่ม: {{surcharge}}', { textAlign: 'right' }),
  element('heading', 340, 700, 215, 20, 'รวมเงินภาษีที่นำส่ง {{total_payable}} บาท', { fontSize: 14, fontWeight: 'bold', textAlign: 'right' }),

  element('paragraph', 36, 742, 523, 34, 'ข้าพเจ้าขอรับรองว่ารายการที่แจ้งไว้ข้างต้นถูกต้องครบถ้วน และยินยอมรับผิดตามกฎหมายทุกประการ', { fontSize: 11, textAlign: 'center' }),
  element('line', 73, 803, 170, 1, '', { color: border }),
  element('line', 352, 803, 170, 1, '', { color: border }),
  element('text', 73, 808, 170, 17, '({{signer_name}}) ผู้มีหน้าที่หักภาษี', { fontSize: 10, textAlign: 'center' }),
  element('text', 352, 808, 170, 17, 'วันที่ยื่น {{filing_date}}', { fontSize: 10, textAlign: 'center' }),
  element('text', 245, 825, 105, 12, 'ตราประทับ (ถ้ามี)', { fontSize: 9, textAlign: 'center', color: '#64748b' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({ where: { slug: 'P.N.D', isGlobal: true } })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารแบบยื่นภาษีเงินได้หัก ณ ที่จ่ายในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-withholding-tax-return-pnd-template'
  const data = {
    name: 'แบบยื่นภาษีเงินได้หัก ณ ที่จ่าย (ภ.ง.ด.1, 3, 53)',
    slug,
    description: 'เทมเพลตแบบยื่นรายการภาษีเงินได้หัก ณ ที่จ่าย A4 สำหรับ ภ.ง.ด.1 ภ.ง.ด.3 และ ภ.ง.ด.53 พร้อมข้อมูลผู้หักภาษี งวดภาษี ตารางสรุปยอด และคำรับรอง',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'แบบยื่นภาษีเงินได้หัก ณ ที่จ่าย', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
