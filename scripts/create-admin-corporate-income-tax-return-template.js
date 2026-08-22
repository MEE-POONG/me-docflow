const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'corporate-income-tax-return-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `corporate-income-tax-return-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 11,
    color: '#17324d',
    ...extra,
  }
}

const border = '#6ca9b7'
const pale = '#e4f4f8'
const elements = [
  element('box', 22, 18, 551, 68, '', { backgroundColor: pale, borderColor: border, borderWidth: 1, borderRadius: 8 }),
  element('heading', 40, 28, 390, 25, 'แบบแสดงรายการภาษีเงินได้นิติบุคคล', { fontSize: 18, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 40, 56, 390, 17, 'ตามมาตรา 68 และมาตรา 69 แห่งประมวลรัษฎากร', { textAlign: 'center' }),
  element('heading', 446, 27, 108, 38, '{{form_type}}', { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#147888' }),
  element('text', 446, 66, 108, 14, 'ภ.ง.ด.50 / 51', { fontSize: 9, textAlign: 'center' }),

  element('checkbox', 34, 101, 16, 16, '{{is_pnd50}}'),
  element('text', 55, 98, 82, 20, 'ภ.ง.ด.50', { fontWeight: 'bold' }),
  element('checkbox', 150, 101, 16, 16, '{{is_pnd51}}'),
  element('text', 171, 98, 82, 20, 'ภ.ง.ด.51', { fontWeight: 'bold' }),
  element('checkbox', 294, 101, 16, 16, '{{is_normal_filing}}'),
  element('text', 315, 98, 82, 20, 'ยื่นปกติ'),
  element('checkbox', 410, 101, 16, 16, '{{is_additional_filing}}'),
  element('text', 431, 98, 124, 20, 'ยื่นเพิ่มเติมครั้งที่ {{filing_no}}'),

  element('box', 22, 132, 551, 183, '', { borderColor: border, borderWidth: 1, borderRadius: 6 }),
  element('heading', 34, 142, 527, 20, 'ข้อมูลบริษัทหรือห้างหุ้นส่วนนิติบุคคล', { fontSize: 14, fontWeight: 'bold', color: '#147888' }),
  element('text', 34, 169, 330, 18, 'เลขประจำตัวผู้เสียภาษีอากร: {{tax_id}}'),
  element('text', 382, 169, 179, 18, 'สาขาที่: {{branch_number}}'),
  element('text', 34, 193, 527, 18, 'ชื่อบริษัท/ห้างหุ้นส่วน: {{company_name}}'),
  element('paragraph', 34, 217, 527, 34, 'ที่ตั้งสำนักงานใหญ่: {{registered_address}}', { textAlign: 'left' }),
  element('text', 34, 257, 250, 18, 'รหัสไปรษณีย์: {{postal_code}}'),
  element('text', 298, 257, 263, 18, 'โทรศัพท์: {{phone}}'),
  element('text', 34, 281, 250, 18, 'เว็บไซต์: {{website}}'),
  element('text', 298, 281, 263, 18, 'อีเมล: {{email}}'),

  element('box', 22, 327, 551, 96, '', { borderColor: border, borderWidth: 1, borderRadius: 6 }),
  element('heading', 34, 337, 527, 20, 'รอบระยะเวลาบัญชีและการยื่นแบบ', { fontSize: 14, fontWeight: 'bold', color: '#147888' }),
  element('text', 34, 365, 250, 18, 'ตั้งแต่วันที่: {{accounting_period_start}}'),
  element('text', 298, 365, 263, 18, 'ถึงวันที่: {{accounting_period_end}}'),
  element('checkbox', 34, 393, 16, 16, '{{is_advance_payment}}'),
  element('text', 55, 390, 175, 20, 'ชำระล่วงหน้า'),
  element('text', 250, 390, 311, 20, 'รหัสกิจการ ISIC: {{isic_code}}'),

  element('box', 22, 435, 551, 111, '', { borderColor: border, borderWidth: 1, borderRadius: 6 }),
  element('heading', 34, 445, 250, 20, 'สถานภาพของนิติบุคคล', { fontSize: 14, fontWeight: 'bold', color: '#147888' }),
  element('checkbox', 34, 474, 16, 16, '{{is_thai_company}}'),
  element('text', 55, 471, 190, 20, 'จัดตั้งตามกฎหมายไทย'),
  element('checkbox', 286, 474, 16, 16, '{{is_foreign_company}}'),
  element('text', 307, 471, 246, 20, 'จัดตั้งตามกฎหมายต่างประเทศ'),
  element('checkbox', 34, 504, 16, 16, '{{is_joint_venture}}'),
  element('text', 55, 501, 190, 20, 'กิจการร่วมค้า'),
  element('checkbox', 286, 504, 16, 16, '{{has_related_parties}}'),
  element('text', 307, 501, 246, 20, 'มีความสัมพันธ์ตามมาตรา 71 ทวิ'),

  element('table', 22, 558, 551, 139, '[กิจการและการคำนวณภาษี]', {
    fontSize: 9,
    tableColumns: [
      { label: 'รายการ', field: 'description', width: 313, align: 'left' },
      { label: 'จำนวนเงิน (บาท)', field: 'amount', width: 119, align: 'right' },
      { label: 'หมายเหตุ', field: 'note', width: 119, align: 'left' },
    ],
    tableRows: 4,
    tableHeaderBold: true,
    tableHeaderBg: pale,
    borderColor: border,
  }),

  element('box', 22, 708, 551, 72, '', { borderColor: border, borderWidth: 1, borderRadius: 6 }),
  element('text', 34, 718, 325, 17, 'กำไรสุทธิทางภาษี: {{taxable_net_profit}} บาท'),
  element('text', 34, 741, 325, 17, 'ภาษีที่ชำระเพิ่มเติม: {{additional_tax}} บาท'),
  element('text', 365, 718, 194, 17, 'ภาษีชำระไว้เกิน: {{overpaid_tax}} บาท', { textAlign: 'right' }),
  element('heading', 365, 741, 194, 20, 'ภาษีสุทธิ {{net_tax_payable}} บาท', { fontSize: 14, fontWeight: 'bold', textAlign: 'right' }),

  element('paragraph', 34, 788, 527, 25, 'ข้าพเจ้าขอรับรองว่ารายการในแบบและเอกสารประกอบถูกต้องครบถ้วนตามความเป็นจริง', { fontSize: 10, textAlign: 'center' }),
  element('line', 68, 824, 190, 1, '', { color: border }),
  element('line', 338, 824, 190, 1, '', { color: border }),
  element('text', 68, 827, 190, 12, '({{director_or_partner_name}}) ผู้รับรอง', { fontSize: 9, textAlign: 'center' }),
  element('text', 338, 827, 190, 12, 'วันที่ยื่น {{filing_date}}', { fontSize: 9, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { name: 'แบบแสดงรายการภาษีเงินได้นิติบุคคล (ภ.ง.ด.50, 51)', isGlobal: true },
  })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสาร ภ.ง.ด.50, 51 ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-corporate-income-tax-return-pnd-50-51-template'
  const data = {
    name: 'แบบแสดงรายการภาษีเงินได้นิติบุคคล (ภ.ง.ด.50, 51)',
    slug,
    description: 'เทมเพลตแบบแสดงรายการภาษีเงินได้นิติบุคคล A4 สำหรับ ภ.ง.ด.50 และ ภ.ง.ด.51 พร้อมข้อมูลบริษัท รอบบัญชี สถานภาพ กิจการ การคำนวณภาษี และคำรับรอง',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'แบบแสดงรายการภาษีเงินได้นิติบุคคล', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
