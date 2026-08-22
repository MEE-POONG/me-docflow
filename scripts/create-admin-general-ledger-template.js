const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'general-ledger-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `general-ledger-${sequence}`,
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
  element('logo', 36, 24, 82, 72, '{{company_logo}}', { objectFit: 'contain' }),
  element('heading', 220, 30, 402, 28, '{{company_name}}', { fontSize: 20, fontWeight: 'bold', textAlign: 'center' }),
  element('heading', 220, 60, 402, 26, 'บัญชีแยกประเภท - สรุปประจำเดือน', { fontSize: 18, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 36, 106, 220, 18, 'จากวันที่ {{period_start}} ถึง {{period_end}}', { fontSize: 13 }),
  element('text', 682, 106, 124, 18, 'หน้า {{page_no}} / {{total_pages}}', { fontSize: 13, textAlign: 'right' }),
  element('line', 36, 130, 770, 1, '', { color: '#374151' }),

  element('text', 36, 142, 90, 18, 'รหัสบัญชี', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 130, 142, 130, 18, '{{account_code}}', { fontSize: 14 }),
  element('text', 280, 142, 78, 18, 'ชื่อบัญชี', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 362, 142, 250, 18, '{{account_name}}', { fontSize: 14 }),
  element('text', 630, 142, 90, 18, 'ยอดยกมา', { fontSize: 13, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 724, 142, 82, 18, '{{opening_balance}}', { fontSize: 14, textAlign: 'right' }),

  element('table', 36, 174, 770, 344, '[รายการบัญชีแยกประเภท]', {
    fontSize: 13,
    tableColumns: [
      { label: 'วันที่เอกสาร', field: 'date', width: 92, align: 'center' },
      { label: 'เลขที่เอกสาร', field: 'documentNo', width: 105, align: 'center' },
      { label: 'รายการลงบัญชี', field: 'description', width: 285, align: 'left' },
      { label: 'เดบิต', field: 'debit', width: 96, align: 'right' },
      { label: 'เครดิต', field: 'credit', width: 96, align: 'right' },
      { label: 'ยอดคงเหลือ', field: 'balance', width: 96, align: 'right' },
    ],
    tableRows: 14,
    tableHeaderBold: true,
    tableHeaderBg: '#f3f4f6',
  }),

  element('text', 36, 528, 482, 22, 'รวม', { fontSize: 15, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 518, 528, 96, 22, '{{total_debit}}', { fontSize: 15, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 614, 528, 96, 22, '{{total_credit}}', { fontSize: 15, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 710, 528, 96, 22, '{{closing_balance}}', { fontSize: 15, fontWeight: 'bold', textAlign: 'right' }),
  element('line', 36, 554, 770, 1, '', { color: '#374151' }),
  element('text', 36, 564, 300, 18, 'จัดทำโดย {{prepared_by}}', { fontSize: 12, color: '#6b7280' }),
  element('text', 506, 564, 300, 18, 'วันที่พิมพ์ {{printed_date}}', { fontSize: 12, color: '#6b7280', textAlign: 'right' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { name: { contains: 'สมุดรายวันและบัญชีแยกประเภท' }, isGlobal: true },
  })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารสมุดรายวันและบัญชีแยกประเภทในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-general-ledger-template'
  const data = {
    name: 'สมุดรายวันและบัญชีแยกประเภท / General Ledger',
    slug,
    description: 'เทมเพลตบัญชีแยกประเภทสรุปประจำเดือน พร้อมรหัสบัญชี รายการเดบิต เครดิต ยอดคงเหลือ และยอดรวม',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'บัญชีแยกประเภท', order: 1, width: 842, height: 595, background: '#ffffff' }],
      elements,
    },
    paperSize: PaperSize.A4,
    orientation: PaperOrientation.LANDSCAPE,
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
