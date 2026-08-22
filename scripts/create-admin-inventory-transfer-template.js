const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'inventory-transfer-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `inventory-transfer-${sequence}`,
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

const accent = '#0f766e'
const border = '#64748b'

const elements = [
  element('heading', 28, 26, 280, 30, '{{company_name}}', { fontSize: 21, fontWeight: 'bold' }),
  element('heading', 320, 26, 247, 30, 'ใบโอนสินค้าระหว่างคลัง', { fontSize: 20, fontWeight: 'bold', textAlign: 'right', color: accent }),
  element('text', 497, 60, 70, 18, 'แผ่นที่ 1 / 1', { fontSize: 10, textAlign: 'right', color: '#64748b' }),

  element('box', 28, 88, 384, 92, '', { borderColor: border }),
  element('text', 40, 99, 112, 20, 'โอนจากคลังสินค้า', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 156, 99, 245, 20, '{{source_warehouse}}', { fontSize: 13 }),
  element('text', 40, 123, 112, 20, 'เข้าคลังสินค้า', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 156, 123, 245, 20, '{{destination_warehouse}}', { fontSize: 13 }),
  element('text', 40, 147, 112, 20, 'รูปแบบการโอน', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 156, 147, 245, 20, '{{transfer_type}}', { fontSize: 13 }),
  element('text', 40, 169, 112, 18, 'หมายเหตุ', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 156, 169, 245, 18, '{{remarks}}', { fontSize: 13 }),

  element('box', 420, 88, 147, 92, '', { borderColor: border }),
  element('text', 430, 98, 54, 20, 'วันที่โอน', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 486, 98, 72, 20, '{{transfer_date}}', { fontSize: 13, textAlign: 'right' }),
  element('line', 420, 125, 147, 1, '', { color: border }),
  element('text', 430, 136, 66, 20, 'เลขที่ใบโอน', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 493, 136, 65, 20, '{{transfer_number}}', { fontSize: 13, fontWeight: 'bold', textAlign: 'right', color: accent }),
  element('text', 430, 160, 128, 16, 'อ้างอิง {{reference_number}}', { fontSize: 11, textAlign: 'right', color: '#64748b' }),

  element('table', 28, 194, 539, 490, '[รายการโอนสินค้าระหว่างคลัง]', {
    fontSize: 12,
    tableColumns: [
      { label: 'ลำดับ', field: 'index', width: 42, align: 'center' },
      { label: 'รหัสสินค้า', field: 'code', width: 84, align: 'left' },
      { label: 'รายละเอียดสินค้า', field: 'name', width: 277, align: 'left' },
      { label: 'จำนวนที่โอน', field: 'qty', width: 78, align: 'right' },
      { label: 'หน่วยนับ', field: 'unit', width: 58, align: 'center' },
    ],
    tableRows: 17,
    tableHeaderBold: true,
    tableHeaderBg: '#f0fdfa',
    borderColor: border,
  }),

  element('box', 28, 698, 539, 118, '', { borderColor: border }),
  element('line', 162, 698, 1, 118, '', { color: border }),
  element('line', 297, 698, 1, 118, '', { color: border }),
  element('line', 432, 698, 1, 118, '', { color: border }),
  element('text', 35, 708, 120, 20, 'ผู้บันทึกรายการ', { fontSize: 13, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 170, 708, 120, 20, 'ผู้จ่ายสินค้า', { fontSize: 13, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 305, 708, 120, 20, 'ผู้รับสินค้า', { fontSize: 13, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 440, 708, 120, 20, 'ผู้ตรวจสอบ', { fontSize: 13, fontWeight: 'bold', textAlign: 'center' }),
  element('line', 44, 766, 102, 1, '', { color: border }),
  element('line', 179, 766, 102, 1, '', { color: border }),
  element('line', 314, 766, 102, 1, '', { color: border }),
  element('line', 449, 766, 102, 1, '', { color: border }),
  element('text', 35, 774, 120, 18, '{{recorded_by}}', { fontSize: 11, textAlign: 'center' }),
  element('text', 170, 774, 120, 18, '{{issued_by}}', { fontSize: 11, textAlign: 'center' }),
  element('text', 305, 774, 120, 18, '{{received_by}}', { fontSize: 11, textAlign: 'center' }),
  element('text', 440, 774, 120, 18, '{{verified_by}}', { fontSize: 11, textAlign: 'center' }),
  element('text', 35, 796, 120, 16, 'วันที่ {{recorded_date}}', { fontSize: 10, textAlign: 'center' }),
  element('text', 170, 796, 120, 16, 'วันที่ {{issued_date}}', { fontSize: 10, textAlign: 'center' }),
  element('text', 305, 796, 120, 16, 'วันที่ {{received_date}}', { fontSize: 10, textAlign: 'center' }),
  element('text', 440, 796, 120, 16, 'วันที่ {{verified_date}}', { fontSize: 10, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({ where: { slug: 'LR', isGlobal: true } })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารควบคุมสินค้าคงคลังในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-inventory-transfer-template'
  const data = {
    name: 'ใบโอนสินค้าระหว่างคลัง',
    slug,
    description: 'เทมเพลตควบคุมสินค้าคงคลัง A4 สำหรับโอนสินค้าระหว่างคลัง พร้อมคลังต้นทางและปลายทาง ตารางสินค้า 17 รายการ และช่องลงนามผู้เกี่ยวข้อง 4 ฝ่าย',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'ใบโอนสินค้าระหว่างคลัง', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
