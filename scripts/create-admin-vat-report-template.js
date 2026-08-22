const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'vat-report-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `vat-report-${sequence}`,
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
  element('heading', 150, 30, 295, 32, '{{report_title}}', { fontSize: 24, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 180, 66, 235, 22, 'ประจำเดือน {{report_month}} พ.ศ. {{report_year}}', { fontSize: 16, textAlign: 'center' }),

  element('text', 42, 106, 95, 20, 'ชื่อผู้ประกอบการ', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 140, 106, 275, 20, '{{company_name}}', { fontSize: 15 }),
  element('line', 140, 128, 275, 1),
  element('text', 42, 136, 95, 20, 'เลขประจำตัวผู้เสียภาษี', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 140, 136, 185, 20, '{{company_tax_id}}', { fontSize: 15 }),
  element('box', 330, 136, 13, 13, '', { borderColor: '#374151', borderWidth: 1 }),
  element('text', 348, 134, 62, 20, 'สำนักงานใหญ่', { fontSize: 13 }),
  element('box', 418, 136, 13, 13, '', { borderColor: '#374151', borderWidth: 1 }),
  element('text', 436, 134, 40, 20, 'สาขา', { fontSize: 13 }),
  element('text', 480, 134, 70, 20, '{{branch_no}}', { fontSize: 14 }),
  element('text', 42, 166, 95, 20, 'ชื่อสถานประกอบการ', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 140, 166, 410, 20, '{{establishment_name}}', { fontSize: 15 }),
  element('line', 140, 188, 410, 1),
  element('text', 42, 196, 95, 20, 'ที่อยู่สถานประกอบการ', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 140, 196, 410, 38, '{{company_address}}', { fontSize: 14 }),

  element('table', 42, 250, 508, 480, '[รายการใบกำกับภาษี]', {
    fontSize: 12,
    tableColumns: [
      { label: 'วันเดือนปี', field: 'date', width: 55, align: 'center' },
      { label: 'เลขที่ใบกำกับภาษี', field: 'invoiceNo', width: 65, align: 'center' },
      { label: 'ชื่อผู้ขายสินค้า / ผู้ให้บริการ', field: 'supplierName', width: 125, align: 'left' },
      { label: 'เลขประจำตัวผู้เสียภาษี', field: 'taxId', width: 90, align: 'center' },
      { label: 'สำนักงานใหญ่ / สาขา', field: 'branch', width: 62, align: 'center' },
      { label: 'มูลค่าสินค้า / บริการ', field: 'taxableAmount', width: 58, align: 'right' },
      { label: 'จำนวนภาษีมูลค่าเพิ่ม', field: 'vatAmount', width: 53, align: 'right' },
    ],
    tableRows: 15,
    tableHeaderBold: true,
    tableHeaderBg: '#f3f4f6',
  }),

  element('text', 42, 740, 318, 20, 'รวมรายการประจำเดือน', { fontSize: 15, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 360, 740, 100, 20, '{{total_taxable_amount}}', { fontSize: 15, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 460, 740, 90, 20, '{{total_vat_amount}}', { fontSize: 15, fontWeight: 'bold', textAlign: 'right' }),
  element('line', 42, 766, 508, 1),
  element('text', 42, 778, 275, 20, 'หมายเหตุ {{remarks}}', { fontSize: 13 }),
  element('text', 330, 778, 220, 20, 'ผู้จัดทำ {{prepared_by}}', { fontSize: 13, textAlign: 'right' }),
  element('text', 330, 802, 220, 20, 'วันที่จัดทำ {{prepared_date}}', { fontSize: 13, textAlign: 'right' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { name: { contains: 'รายงานภาษีซื้อ' }, isGlobal: true },
  })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารรายงานภาษีซื้อ / รายงานภาษีขายในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-vat-purchase-sales-report-template'
  const data = {
    name: 'รายงานภาษีซื้อ / รายงานภาษีขาย',
    slug,
    description: 'เทมเพลตรายงานภาษีซื้อหรือภาษีขาย พร้อมข้อมูลสถานประกอบการ ตารางใบกำกับภาษี และยอดรวมประจำเดือน',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'รายงานภาษีซื้อ-ขาย', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
