const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'withholding-tax-certificate-50bis-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `withholding-tax-certificate-50bis-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 10,
    color: '#111827',
    ...extra,
  }
}

const border = '#475569'
const pale = '#f1f5f9'
const elements = [
  element('heading', 40, 20, 515, 27, 'หนังสือรับรองการหักภาษี ณ ที่จ่าย', { fontSize: 20, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 40, 49, 515, 18, 'ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร', { fontSize: 12, textAlign: 'center' }),
  element('text', 40, 70, 245, 17, 'ฉบับที่ {{copy_number}}'),
  element('text', 365, 70, 190, 17, 'เล่มที่ {{book_number}}  เลขที่ {{certificate_number}}', { textAlign: 'right' }),

  element('box', 24, 94, 547, 105, '', { borderColor: border, borderWidth: 1, borderRadius: 5 }),
  element('heading', 35, 103, 527, 18, 'ผู้มีหน้าที่หักภาษี ณ ที่จ่าย', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 35, 128, 330, 17, 'เลขประจำตัวผู้เสียภาษีอากร: {{payer_tax_id}}'),
  element('text', 385, 128, 177, 17, 'สาขาที่ {{payer_branch}}'),
  element('text', 35, 151, 527, 17, 'ชื่อ: {{payer_name}}'),
  element('paragraph', 35, 173, 527, 22, 'ที่อยู่: {{payer_address}}'),

  element('box', 24, 210, 547, 105, '', { borderColor: border, borderWidth: 1, borderRadius: 5 }),
  element('heading', 35, 219, 527, 18, 'ผู้ถูกหักภาษี ณ ที่จ่าย', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 35, 244, 330, 17, 'เลขประจำตัวผู้เสียภาษีอากร: {{payee_tax_id}}'),
  element('text', 385, 244, 177, 17, 'สาขาที่ {{payee_branch}}'),
  element('text', 35, 267, 527, 17, 'ชื่อ: {{payee_name}}'),
  element('paragraph', 35, 289, 527, 22, 'ที่อยู่: {{payee_address}}'),

  element('box', 24, 326, 547, 60, '', { backgroundColor: pale, borderColor: border, borderWidth: 1, borderRadius: 4 }),
  element('text', 35, 336, 137, 17, 'ลำดับที่ในแบบ {{form_sequence}}'),
  element('checkbox', 185, 337, 14, 14, '{{is_pnd1}}'),
  element('text', 204, 334, 61, 18, 'ภ.ง.ด.1'),
  element('checkbox', 276, 337, 14, 14, '{{is_pnd3}}'),
  element('text', 295, 334, 61, 18, 'ภ.ง.ด.3'),
  element('checkbox', 367, 337, 14, 14, '{{is_pnd53}}'),
  element('text', 386, 334, 70, 18, 'ภ.ง.ด.53'),
  element('checkbox', 467, 337, 14, 14, '{{is_other_form}}'),
  element('text', 486, 334, 70, 18, 'อื่น ๆ'),
  element('text', 35, 360, 527, 17, 'แบบที่ใช้ยื่น: {{filing_form_name}}'),

  element('table', 24, 398, 547, 236, '[รายการเงินได้และภาษีหัก ณ ที่จ่าย]', {
    fontSize: 8,
    tableColumns: [
      { label: 'ประเภทเงินได้พึงประเมินที่จ่าย', field: 'incomeType', width: 264, align: 'left' },
      { label: 'วัน/เดือน/ปีที่จ่าย', field: 'paymentDate', width: 90, align: 'center' },
      { label: 'จำนวนเงินที่จ่าย', field: 'incomeAmount', width: 96, align: 'right' },
      { label: 'ภาษีที่หักและนำส่ง', field: 'taxWithheld', width: 97, align: 'right' },
    ],
    tableRows: 8,
    tableHeaderBold: true,
    tableHeaderBg: pale,
    borderColor: border,
  }),

  element('box', 24, 646, 547, 74, '', { borderColor: border, borderWidth: 1, borderRadius: 4 }),
  element('heading', 35, 657, 320, 18, 'รวมเงินที่จ่าย {{total_income_amount}} บาท', { fontSize: 13, fontWeight: 'bold' }),
  element('heading', 365, 657, 196, 18, 'รวมภาษี {{total_tax_withheld}} บาท', { fontSize: 13, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 35, 683, 526, 17, 'รวมเงินภาษีที่หักนำส่ง (ตัวอักษร) {{total_tax_in_words}}'),
  element('text', 35, 704, 526, 14, 'เงินสะสมกองทุนสำรองเลี้ยงชีพ {{provident_fund}} | ประกันสังคม {{social_security}} | กบข./กสจ. {{government_fund}}', { fontSize: 9 }),

  element('box', 24, 732, 547, 45, '', { backgroundColor: pale, borderColor: border, borderWidth: 1, borderRadius: 4 }),
  element('checkbox', 35, 746, 14, 14, '{{payment_withheld}}'),
  element('text', 54, 743, 93, 18, 'หัก ณ ที่จ่าย'),
  element('checkbox', 160, 746, 14, 14, '{{payment_always}}'),
  element('text', 179, 743, 91, 18, 'ออกให้ตลอดไป'),
  element('checkbox', 284, 746, 14, 14, '{{payment_once}}'),
  element('text', 303, 743, 91, 18, 'ออกให้ครั้งเดียว'),
  element('text', 407, 743, 154, 18, 'วิธีจ่ายอื่น: {{payment_method}}'),

  element('paragraph', 38, 788, 519, 20, 'ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ', { fontSize: 9, textAlign: 'center' }),
  element('line', 78, 823, 180, 1, '', { color: border }),
  element('line', 338, 823, 180, 1, '', { color: border }),
  element('text', 78, 827, 180, 12, '({{payer_authorized_name}}) ผู้จ่ายเงิน', { fontSize: 8, textAlign: 'center' }),
  element('text', 338, 827, 180, 12, 'วันที่ออก {{issue_date}}', { fontSize: 8, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { name: 'หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)', isGlobal: true },
  })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสาร 50 ทวิ ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-withholding-tax-certificate-50-bis-template'
  const data = {
    name: 'หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)',
    slug,
    description: 'เทมเพลตหนังสือรับรองการหักภาษี ณ ที่จ่าย 50 ทวิ แบบ A4 พร้อมข้อมูลผู้จ่าย ผู้รับ ประเภทเงินได้ ตารางยอดจ่ายและภาษี กองทุน วิธีจ่าย และคำรับรอง',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
  .finally(async () => prisma.$disconnect())
