const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'purchase-order-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `purchase-order-${sequence}`,
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

const accent = '#df2b6f'

const elements = [
  element('logo', 26, 25, 58, 58, '[โลโก้บริษัท]'),
  element('heading', 92, 29, 250, 34, '{{company_name}}', { fontSize: 23, fontWeight: 'bold', color: '#2298c8' }),
  element('paragraph', 26, 88, 300, 92,
    '{{company_name}}\n{{company_address}}\nเลขประจำตัวผู้เสียภาษี {{company_taxid}}\nโทรศัพท์ {{company_phone}}',
    { fontSize: 13 }),

  element('heading', 360, 43, 188, 34, 'ใบสั่งซื้อ', { fontSize: 25, fontWeight: 'bold', textAlign: 'center', color: accent }),
  element('box', 548, 15, 24, 58, '', { color: accent }),
  element('line', 350, 90, 198, 1),
  element('text', 358, 101, 74, 22, 'เลขที่', { fontSize: 13, color: accent }),
  element('text', 432, 101, 116, 22, '{{doc_no}}', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 358, 125, 74, 22, 'วันที่', { fontSize: 13, color: accent }),
  element('text', 432, 125, 116, 22, '{{doc_date}}', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 358, 149, 74, 22, 'ครบกำหนด', { fontSize: 13, color: accent }),
  element('text', 432, 149, 116, 22, '{{expire_date}}', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 358, 173, 74, 22, 'ผู้สั่งซื้อ', { fontSize: 13, color: accent }),
  element('text', 432, 173, 116, 22, '{{ordered_by}}', { fontSize: 13, fontWeight: 'bold' }),
  element('line', 350, 201, 198, 1),

  element('heading', 26, 194, 120, 22, 'ผู้จำหน่าย', { fontSize: 14, fontWeight: 'bold', color: accent }),
  element('paragraph', 26, 220, 295, 102,
    '{{vendor_name}}\n{{vendor_address}}\nเลขประจำตัวผู้เสียภาษี {{vendor_taxid}}\nโทรศัพท์ {{vendor_phone}}',
    { fontSize: 13 }),
  element('text', 350, 218, 78, 22, 'ชื่องาน', { fontSize: 13, color: accent }),
  element('text', 428, 218, 120, 22, '{{project_name}}', { fontSize: 13 }),
  element('text', 350, 242, 78, 22, 'ผู้ติดต่อ', { fontSize: 13, color: accent }),
  element('text', 428, 242, 120, 22, '{{contact_name}}', { fontSize: 13 }),
  element('text', 350, 266, 78, 22, 'เบอร์โทร', { fontSize: 13, color: accent }),
  element('text', 428, 266, 120, 22, '{{contact_phone}}', { fontSize: 13 }),
  element('text', 350, 290, 78, 22, 'อีเมล', { fontSize: 13, color: accent }),
  element('text', 428, 290, 120, 22, '{{contact_email}}', { fontSize: 13 }),
  element('line', 26, 329, 522, 1),

  element('table', 26, 340, 522, 165, '[รายการสั่งซื้อ]', {
    fontSize: 11,
    tableColumns: [
      { label: '#', field: 'index', width: 35, align: 'center' },
      { label: 'รายละเอียด', field: 'name', width: 231, align: 'left' },
      { label: 'จำนวน', field: 'qty', width: 65, align: 'right' },
      { label: 'ราคาต่อหน่วย', field: 'unitPrice', width: 85, align: 'right' },
      { label: 'ส่วนลด', field: 'discount', width: 48, align: 'right' },
      { label: 'มูลค่า', field: 'total', width: 58, align: 'right' },
    ],
    tableRows: 6,
    tableHeaderBold: true,
    tableHeaderBg: '#ffffff',
  }),

  element('text', 26, 518, 260, 22, '({{total_amount_text}})', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 355, 518, 108, 22, 'รวมเป็นเงิน', { fontSize: 13, textAlign: 'right', color: accent }),
  element('text', 470, 518, 78, 22, '{{subtotal}}', { fontSize: 13, textAlign: 'right' }),
  element('text', 355, 542, 108, 22, 'ภาษีมูลค่าเพิ่ม 7%', { fontSize: 13, textAlign: 'right', color: accent }),
  element('text', 470, 542, 78, 22, '{{vat}}', { fontSize: 13, textAlign: 'right' }),
  element('text', 335, 566, 128, 22, 'ราคาที่รวมภาษีมูลค่าเพิ่ม', { fontSize: 12, textAlign: 'right', color: accent }),
  element('text', 470, 566, 78, 22, '{{total_amount}}', { fontSize: 13, textAlign: 'right' }),
  element('text', 335, 590, 128, 22, 'จำนวนเงินรวมทั้งสิ้น', { fontSize: 13, textAlign: 'right', color: accent, fontWeight: 'bold' }),
  element('text', 470, 590, 78, 22, '{{total_amount}}', { fontSize: 14, textAlign: 'right', fontWeight: 'bold' }),

  element('heading', 26, 625, 100, 22, 'หมายเหตุ', { fontSize: 14, fontWeight: 'bold', color: accent }),
  element('paragraph', 26, 650, 300, 62, '{{remarks}}', { fontSize: 13 }),
  element('heading', 350, 625, 100, 22, 'สถานที่จัดส่ง', { fontSize: 14, fontWeight: 'bold', color: accent }),
  element('paragraph', 350, 650, 198, 62, '{{delivery_address}}\nกำหนดส่ง {{delivery_date}}', { fontSize: 13 }),

  element('text', 26, 735, 220, 22, 'ในนาม {{company_name}}', { fontSize: 12 }),
  element('text', 350, 735, 198, 22, 'อนุมัติโดย {{company_name}}', { fontSize: 12, textAlign: 'right' }),
  element('line', 26, 786, 105, 1),
  element('line', 156, 786, 90, 1),
  element('line', 350, 786, 105, 1),
  element('line', 480, 786, 68, 1),
  element('text', 26, 795, 105, 20, 'ผู้ขอซื้อ', { fontSize: 12, textAlign: 'center' }),
  element('text', 156, 795, 90, 20, 'วันที่', { fontSize: 12, textAlign: 'center' }),
  element('text', 350, 795, 105, 20, 'ผู้อนุมัติ', { fontSize: 12, textAlign: 'center' }),
  element('text', 480, 795, 68, 20, 'วันที่', { fontSize: 12, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'PURCH', isGlobal: true },
  })

  if (!documentType) throw new Error('ไม่พบประเภทเอกสารใบสั่งซื้อ (PURCH) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-modern-purchase-order-template'
  const data = {
    name: 'ใบสั่งซื้อมาตรฐาน',
    slug,
    description: 'เทมเพลตใบสั่งซื้อ A4 พร้อมข้อมูลบริษัท ผู้จำหน่าย ผู้ติดต่อ ตารางสินค้า สรุปยอด สถานที่จัดส่ง หมายเหตุ และช่องอนุมัติ',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'ใบสั่งซื้อ', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
