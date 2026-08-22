const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'vat-registration-certificate-pp20-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `vat-registration-certificate-pp20-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 14,
    color: '#2d241f',
    ...extra,
  }
}

const gold = '#9b7b47'
const pale = '#faf5e9'
const elements = [
  element('box', 27, 24, 541, 790, '', { borderColor: gold, borderWidth: 2, borderRadius: 4 }),
  element('box', 39, 36, 517, 766, '', { borderColor: '#d9c8a6', borderWidth: 1, borderRadius: 3 }),
  element('text', 50, 49, 155, 20, 'กรมสรรพากร', { fontSize: 13, fontWeight: 'bold' }),
  element('heading', 175, 55, 245, 30, 'ใบทะเบียนภาษีมูลค่าเพิ่ม', { fontSize: 23, fontWeight: 'bold', textAlign: 'center' }),
  element('heading', 449, 50, 85, 33, 'ภ.พ.20', { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: gold }),
  element('line', 94, 101, 407, 1, '', { color: gold }),
  element('text', 94, 110, 407, 20, 'ออกให้ตามประมวลรัษฎากร หมวดภาษีมูลค่าเพิ่ม', { fontSize: 12, textAlign: 'center' }),

  element('heading', 69, 153, 457, 30, '{{taxpayer_name}}', { fontSize: 21, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 69, 189, 457, 24, 'เลขประจำตัวผู้เสียภาษีอากร {{tax_id}}', { fontSize: 16, textAlign: 'center' }),
  element('text', 69, 218, 457, 22, 'ทะเบียนภาษีมูลค่าเพิ่มเลขที่ {{vat_registration_number}}', { fontSize: 16, textAlign: 'center' }),

  element('box', 62, 264, 471, 216, '', { backgroundColor: pale, borderColor: '#d9c8a6', borderWidth: 1, borderRadius: 6 }),
  element('heading', 81, 280, 433, 24, 'รายละเอียดสถานประกอบการที่จดทะเบียน', { fontSize: 17, fontWeight: 'bold', textAlign: 'center', color: gold }),
  element('text', 81, 321, 280, 22, 'ชื่อสถานประกอบการ: {{establishment_name}}'),
  element('text', 381, 321, 133, 22, 'สาขาที่ {{branch_number}}'),
  element('paragraph', 81, 357, 433, 58, 'ที่ตั้งสถานประกอบการ: {{establishment_address}}', { fontSize: 14, textAlign: 'left' }),
  element('text', 81, 426, 216, 22, 'โทรศัพท์: {{phone}}'),
  element('text', 307, 426, 207, 22, 'อีเมล: {{email}}'),

  element('paragraph', 76, 514, 443, 63,
    'หนังสือฉบับนี้รับรองว่า ผู้ประกอบการข้างต้นเป็นผู้ประกอบการจดทะเบียนภาษีมูลค่าเพิ่มตามกฎหมาย ตั้งแต่วันที่ {{vat_effective_date}} เป็นต้นไป',
    { fontSize: 15, textAlign: 'justify' }),
  element('text', 76, 592, 443, 24, 'วันที่ออกใบทะเบียน {{certificate_issue_date}}', { fontSize: 15, textAlign: 'center' }),
  element('text', 76, 624, 443, 24, 'สำนักงานสรรพากรพื้นที่ {{revenue_office}}', { fontSize: 15, textAlign: 'center' }),

  element('line', 193, 704, 209, 1, '', { color: gold }),
  element('text', 193, 711, 209, 22, '({{authorized_officer_name}})', { fontSize: 13, textAlign: 'center' }),
  element('text', 193, 735, 209, 22, '{{authorized_officer_position}}', { fontSize: 13, textAlign: 'center' }),
  element('text', 193, 759, 209, 20, 'เจ้าพนักงานออกใบทะเบียน', { fontSize: 12, textAlign: 'center' }),
  element('text', 68, 774, 110, 18, 'ตราประทับราชการ', { fontSize: 10, textAlign: 'center', color: '#7c6f64' }),
  element('qrCode', 451, 710, 64, 64, '{{verification_url}}'),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { name: 'ใบทะเบียนภาษีมูลค่าเพิ่ม (ภ.พ.20)', isGlobal: true },
  })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสาร ภ.พ.20 ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-vat-registration-certificate-pp20-template'
  const data = {
    name: 'ใบทะเบียนภาษีมูลค่าเพิ่ม (ภ.พ.20)',
    slug,
    description: 'เทมเพลตใบทะเบียนภาษีมูลค่าเพิ่ม ภ.พ.20 แบบ A4 สำหรับรับรองผู้ประกอบการจดทะเบียน พร้อมเลขทะเบียน สถานประกอบการ วันที่มีผล เจ้าพนักงาน และ QR ตรวจสอบ',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'ใบทะเบียนภาษีมูลค่าเพิ่ม (ภ.พ.20)', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
