const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'timesheet-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `timesheet-${sequence}`,
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
  element('heading', 70, 30, 455, 30, 'ใบลงเวลาปฏิบัติงาน {{organization_name}}', { fontSize: 21, fontWeight: 'bold', textAlign: 'center' }),
  element('heading', 150, 66, 295, 26, 'ประจำเดือน {{work_month}} พ.ศ. {{work_year}}', { fontSize: 18, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 48, 104, 250, 20, 'หน่วยงาน / แผนก {{department}}', { fontSize: 14 }),
  element('text', 330, 104, 217, 20, 'ผู้ควบคุมงาน {{supervisor_name}}', { fontSize: 14, textAlign: 'right' }),

  element('table', 48, 138, 499, 548, '[รายการลงเวลาปฏิบัติงาน]', {
    fontSize: 13,
    tableColumns: [
      { label: 'วัน/เดือน/ปี', field: 'date', width: 70, align: 'center' },
      { label: 'ชื่อ - นามสกุล', field: 'employeeName', width: 140, align: 'left' },
      { label: 'เวลาเข้า', field: 'timeIn', width: 55, align: 'center' },
      { label: 'เวลากลับ', field: 'timeOut', width: 55, align: 'center' },
      { label: 'รายละเอียดที่ปฏิบัติงาน', field: 'workDetails', width: 124, align: 'left' },
      { label: 'ลายมือชื่อ', field: 'signature', width: 55, align: 'center' },
    ],
    tableRows: 22,
    tableHeaderBold: true,
    tableHeaderBg: '#f3f4f6',
  }),

  element('text', 48, 704, 250, 20, 'รวมชั่วโมงปฏิบัติงาน {{total_hours}} ชั่วโมง', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 330, 704, 217, 20, 'จำนวนวันปฏิบัติงาน {{total_days}} วัน', { fontSize: 14, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 180, 748, 235, 20, 'ลงชื่อ {{certifier_signature}}', { fontSize: 14, textAlign: 'center' }),
  element('line', 210, 772, 175, 1),
  element('text', 180, 780, 235, 20, '({{certifier_name}})', { fontSize: 14, textAlign: 'center' }),
  element('text', 180, 804, 235, 20, 'วันที่ {{certified_date}}', { fontSize: 13, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'TIMES', isGlobal: true },
  })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารใบบันทึกเวลาทำงาน / Timesheet ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-monthly-timesheet-template'
  const data = {
    name: 'ใบลงเวลาปฏิบัติงานประจำเดือน / Monthly Timesheet',
    slug,
    description: 'เทมเพลตลงเวลาปฏิบัติงาน พร้อมวันที่ ชื่อพนักงาน เวลาเข้า-ออก รายละเอียดงาน ลายมือชื่อ และส่วนรับรอง',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'ใบลงเวลาปฏิบัติงาน', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
