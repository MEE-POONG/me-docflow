const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'vat-return-pp30-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `vat-return-pp30-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 11,
    color: '#3f2d2d',
    ...extra,
  }
}

const border = '#b38d86'
const pale = '#f5ebe8'
const elements = [
  element('box', 22, 18, 551, 66, '', { backgroundColor: pale, borderColor: border, borderWidth: 1, borderRadius: 8 }),
  element('heading', 40, 28, 390, 24, 'แบบแสดงรายการภาษีมูลค่าเพิ่ม', { fontSize: 19, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 40, 55, 390, 16, 'ตามประมวลรัษฎากร', { textAlign: 'center' }),
  element('heading', 446, 27, 108, 38, 'ภ.พ.30', { fontSize: 25, fontWeight: 'bold', textAlign: 'center', color: '#8b4b43' }),

  element('box', 22, 96, 551, 177, '', { borderColor: border, borderWidth: 1, borderRadius: 6 }),
  element('heading', 34, 106, 527, 20, 'ข้อมูลผู้ประกอบการจดทะเบียน', { fontSize: 14, fontWeight: 'bold', color: '#8b4b43' }),
  element('text', 34, 134, 330, 18, 'เลขประจำตัวผู้เสียภาษีอากร: {{tax_id}}'),
  element('text', 382, 134, 179, 18, 'สาขาที่: {{branch_number}}'),
  element('text', 34, 158, 527, 18, 'ชื่อผู้ประกอบการ: {{taxpayer_name}}'),
  element('paragraph', 34, 182, 527, 34, 'ชื่อสถานประกอบการและที่อยู่: {{business_address}}'),
  element('text', 34, 224, 250, 18, 'รหัสไปรษณีย์: {{postal_code}}'),
  element('text', 298, 224, 263, 18, 'โทรศัพท์: {{phone}}'),
  element('text', 34, 248, 527, 18, 'อีเมล: {{email}}'),

  element('box', 22, 285, 551, 80, '', { borderColor: border, borderWidth: 1, borderRadius: 6 }),
  element('heading', 34, 295, 527, 20, 'เดือนภาษีและประเภทการยื่นแบบ', { fontSize: 14, fontWeight: 'bold', color: '#8b4b43' }),
  element('text', 34, 324, 160, 18, 'เดือนภาษี: {{tax_month}}'),
  element('text', 195, 324, 105, 18, 'ปีภาษี: {{tax_year}}'),
  element('checkbox', 316, 325, 16, 16, '{{is_normal_filing}}'),
  element('text', 337, 322, 72, 20, 'ยื่นปกติ'),
  element('checkbox', 420, 325, 16, 16, '{{is_additional_filing}}'),
  element('text', 441, 322, 116, 20, 'เพิ่มเติมครั้งที่ {{filing_no}}'),

  element('table', 22, 377, 551, 221, '[การคำนวณภาษีมูลค่าเพิ่ม]', {
    fontSize: 9,
    tableColumns: [
      { label: 'รายการ', field: 'description', width: 344, align: 'left' },
      { label: 'ฐานภาษี (บาท)', field: 'taxBase', width: 103, align: 'right' },
      { label: 'ภาษี (บาท)', field: 'taxAmount', width: 104, align: 'right' },
    ],
    tableRows: 8,
    tableHeaderBold: true,
    tableHeaderBg: pale,
    borderColor: border,
  }),

  element('box', 22, 610, 551, 132, '', { borderColor: border, borderWidth: 1, borderRadius: 6 }),
  element('heading', 34, 620, 527, 20, 'สรุปภาษีที่ต้องชำระหรือชำระเกิน', { fontSize: 14, fontWeight: 'bold', color: '#8b4b43' }),
  element('text', 34, 650, 330, 18, 'ภาษีขายเดือนนี้: {{output_vat}} บาท'),
  element('text', 34, 674, 330, 18, 'ภาษีซื้อเดือนนี้: {{input_vat}} บาท'),
  element('text', 34, 698, 330, 18, 'ยอดยกมา/เครดิตภาษี: {{vat_credit_carried}} บาท'),
  element('text', 368, 650, 189, 18, 'เงินเพิ่ม: {{surcharge}} บาท', { textAlign: 'right' }),
  element('text', 368, 674, 189, 18, 'เบี้ยปรับ: {{penalty}} บาท', { textAlign: 'right' }),
  element('heading', 344, 704, 213, 21, 'ยอดสุทธิ {{net_vat}} บาท', { fontSize: 15, fontWeight: 'bold', textAlign: 'right' }),

  element('checkbox', 34, 755, 16, 16, '{{request_refund}}'),
  element('text', 55, 752, 242, 20, 'ขอคืนเงินภาษีที่ชำระไว้เกิน'),
  element('checkbox', 316, 755, 16, 16, '{{carry_forward_credit}}'),
  element('text', 337, 752, 220, 20, 'นำเครดิตภาษีไปใช้เดือนถัดไป'),
  element('paragraph', 34, 781, 527, 22, 'ข้าพเจ้าขอรับรองว่ารายการในแบบนี้ถูกต้องครบถ้วนตามความเป็นจริง', { fontSize: 10, textAlign: 'center' }),
  element('line', 68, 821, 190, 1, '', { color: border }),
  element('line', 338, 821, 190, 1, '', { color: border }),
  element('text', 68, 825, 190, 12, '({{authorized_person}}) ผู้ประกอบการ', { fontSize: 9, textAlign: 'center' }),
  element('text', 338, 825, 190, 12, 'วันที่ยื่น {{filing_date}}', { fontSize: 9, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { name: 'แบบแสดงรายการภาษีมูลค่าเพิ่ม (ภ.พ.30)', isGlobal: true },
  })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสาร ภ.พ.30 ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-vat-return-pp30-template'
  const data = {
    name: 'แบบแสดงรายการภาษีมูลค่าเพิ่ม (ภ.พ.30)',
    slug,
    description: 'เทมเพลตแบบแสดงรายการภาษีมูลค่าเพิ่ม ภ.พ.30 แบบ A4 พร้อมข้อมูลผู้ประกอบการ เดือนภาษี ตารางคำนวณภาษีขายและภาษีซื้อ ยอดชำระหรือขอคืน และคำรับรอง',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'แบบแสดงรายการภาษีมูลค่าเพิ่ม (ภ.พ.30)', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
