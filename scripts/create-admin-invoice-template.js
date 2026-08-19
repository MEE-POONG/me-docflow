const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'invoice-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `invoice-${sequence}`,
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

const elements = [
  element('logo', 27, 25, 58, 58, '[โลโก้บริษัท]'),
  element('heading', 92, 29, 250, 34, '{{company_name}}', { fontSize: 23, fontWeight: 'bold', color: '#2298c8' }),
  element('paragraph', 27, 88, 310, 105,
    '{{company_name}}\n{{company_address}}\nเลขประจำตัวผู้เสียภาษี {{company_taxid}}\nโทรศัพท์ {{company_phone}}',
    { fontSize: 13 }),

  element('heading', 358, 45, 190, 34, 'ใบวางบิล/ใบแจ้งหนี้', { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#724091' }),
  element('text', 358, 78, 190, 20, 'ต้นฉบับ', { fontSize: 12, textAlign: 'center', color: '#724091' }),
  element('box', 548, 15, 24, 58, '', { color: '#724091' }),
  element('text', 548, 30, 24, 24, '1', { fontSize: 18, textAlign: 'center', color: '#ffffff', fontWeight: 'bold' }),
  element('line', 350, 105, 198, 1),
  element('text', 358, 116, 74, 22, 'เลขที่', { fontSize: 13, color: '#724091' }),
  element('text', 432, 116, 116, 22, '{{doc_no}}', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 358, 140, 74, 22, 'วันที่', { fontSize: 13, color: '#724091' }),
  element('text', 432, 140, 116, 22, '{{doc_date}}', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 358, 164, 74, 22, 'ครบกำหนด', { fontSize: 13, color: '#724091' }),
  element('text', 432, 164, 116, 22, '{{expire_date}}', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 358, 188, 74, 22, 'ผู้ขาย', { fontSize: 13, color: '#724091' }),
  element('text', 432, 188, 116, 22, '{{salesperson}}', { fontSize: 13, fontWeight: 'bold' }),
  element('line', 350, 215, 198, 1),

  element('heading', 27, 220, 120, 24, 'ลูกค้า', { fontSize: 14, fontWeight: 'bold', color: '#724091' }),
  element('paragraph', 27, 246, 521, 82,
    '{{customer_name}}\n{{customer_address}}\nเลขประจำตัวผู้เสียภาษี {{customer_taxid}}',
    { fontSize: 13 }),
  element('line', 27, 334, 521, 1),

  element('table', 27, 346, 521, 150, '[รายการสินค้าและบริการ]', {
    fontSize: 11,
    tableColumns: [
      { label: '#', field: 'index', width: 34, align: 'center' },
      { label: 'รายละเอียด', field: 'name', width: 226, align: 'left' },
      { label: 'จำนวน', field: 'qty', width: 62, align: 'right' },
      { label: 'ราคาต่อหน่วย', field: 'unitPrice', width: 82, align: 'right' },
      { label: 'ส่วนลด', field: 'discount', width: 54, align: 'right' },
      { label: 'มูลค่า', field: 'total', width: 63, align: 'right' },
    ],
    tableRows: 5,
    tableHeaderBold: true,
    tableHeaderBg: '#ffffff',
  }),

  element('text', 27, 512, 260, 24, '({{total_amount_text}})', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 355, 512, 108, 22, 'รวมเป็นเงิน', { fontSize: 13, textAlign: 'right', color: '#724091' }),
  element('text', 470, 512, 78, 22, '{{subtotal}}', { fontSize: 13, textAlign: 'right' }),
  element('text', 355, 536, 108, 22, 'ภาษีมูลค่าเพิ่ม 7%', { fontSize: 13, textAlign: 'right', color: '#724091' }),
  element('text', 470, 536, 78, 22, '{{vat}}', { fontSize: 13, textAlign: 'right' }),
  element('text', 335, 560, 128, 22, 'ราคาที่รวมภาษีมูลค่าเพิ่ม', { fontSize: 12, textAlign: 'right', color: '#724091' }),
  element('text', 470, 560, 78, 22, '{{total_amount}}', { fontSize: 13, textAlign: 'right' }),
  element('text', 335, 584, 128, 22, 'จำนวนเงินรวมทั้งสิ้น', { fontSize: 13, textAlign: 'right', color: '#724091', fontWeight: 'bold' }),
  element('text', 470, 584, 78, 22, '{{total_amount}}', { fontSize: 14, textAlign: 'right', fontWeight: 'bold' }),

  element('heading', 27, 620, 100, 22, 'หมายเหตุ', { fontSize: 14, fontWeight: 'bold', color: '#724091' }),
  element('paragraph', 27, 646, 300, 70, '{{remarks}}\nสามารถโอนเงินเข้าบัญชี {{bank_name}} เลขที่ {{bank_account_no}}', { fontSize: 13 }),

  element('text', 27, 730, 220, 22, 'ในนาม {{customer_name}}', { fontSize: 12 }),
  element('text', 370, 730, 178, 22, 'ในนาม {{company_name}}', { fontSize: 12, textAlign: 'right' }),
  element('line', 27, 785, 105, 1),
  element('line', 157, 785, 90, 1),
  element('line', 350, 785, 105, 1),
  element('line', 480, 785, 68, 1),
  element('text', 27, 794, 105, 20, 'ผู้รับวางบิล', { fontSize: 12, textAlign: 'center' }),
  element('text', 157, 794, 90, 20, 'วันที่', { fontSize: 12, textAlign: 'center' }),
  element('text', 350, 794, 105, 20, 'ผู้วางบิล', { fontSize: 12, textAlign: 'center' }),
  element('text', 480, 794, 68, 20, 'วันที่', { fontSize: 12, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'IV', isGlobal: true },
  })

  if (!documentType) throw new Error('ไม่พบประเภทเอกสารใบแจ้งหนี้ / ใบวางบิล (IV) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-modern-invoice-billing-note-template'
  const data = {
    name: 'ใบวางบิล / ใบแจ้งหนี้มาตรฐาน',
    slug,
    description: 'เทมเพลตใบวางบิลและใบแจ้งหนี้ A4 พร้อมข้อมูลบริษัท ลูกค้า ตารางสินค้า สรุปภาษี หมายเหตุ และช่องลงนาม',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'ใบวางบิล / ใบแจ้งหนี้', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
