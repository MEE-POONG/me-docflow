const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'leave-request-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `leave-request-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 15,
    color: '#111827',
    ...extra,
  }
}

const elements = [
  element('heading', 118, 28, 359, 30, 'ใบลาป่วย ลาคลอดบุตร ลากิจส่วนตัว', { fontSize: 22, fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline' }),
  element('text', 370, 78, 180, 20, 'เขียนที่ {{written_at}}', { fontSize: 14 }),
  element('text', 370, 104, 180, 20, 'วันที่ {{request_date}}', { fontSize: 14 }),
  element('text', 44, 136, 56, 20, 'เรื่อง', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 102, 136, 448, 20, '{{subject}}', { fontSize: 15 }),
  element('line', 102, 158, 448, 1),
  element('text', 44, 168, 56, 20, 'เรียน', { fontSize: 14, fontWeight: 'bold' }),
  element('text', 102, 168, 448, 20, '{{approver_title}}', { fontSize: 15 }),
  element('line', 102, 190, 448, 1),

  element('text', 62, 210, 488, 24, 'ข้าพเจ้า {{employee_name}}  ตำแหน่ง {{position}}  ระดับ {{level}}', { fontSize: 15 }),
  element('text', 62, 240, 488, 24, 'สังกัด {{department}}', { fontSize: 15 }),
  element('text', 62, 274, 210, 70, 'ขอลา\n□ ป่วย\n□ กิจส่วนตัว\n□ คลอดบุตร', { fontSize: 15 }),
  element('text', 250, 274, 300, 24, 'เนื่องจาก {{leave_reason}}', { fontSize: 15 }),
  element('line', 315, 300, 235, 1),
  element('text', 62, 354, 488, 24, 'ตั้งแต่วันที่ {{leave_start_date}} ถึงวันที่ {{leave_end_date}} มีกำหนด {{leave_days}} วัน', { fontSize: 15 }),
  element('text', 62, 386, 488, 24, 'ในระหว่างลาสามารถติดต่อได้ที่ {{contact_address}}', { fontSize: 14 }),
  element('text', 62, 416, 300, 24, 'หมายเลขโทรศัพท์ {{contact_phone}}', { fontSize: 14 }),
  element('text', 335, 450, 215, 20, 'ลงชื่อ {{employee_signature}}', { fontSize: 14, textAlign: 'center' }),
  element('text', 335, 476, 215, 20, '({{employee_name}})', { fontSize: 14, textAlign: 'center' }),

  element('heading', 44, 516, 235, 24, 'สถิติการลาในปีงบประมาณนี้', { fontSize: 16, fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline' }),
  element('table', 44, 546, 235, 132, '[สถิติการลา]', {
    fontSize: 13,
    tableColumns: [
      { label: 'ประเภทลา', field: 'leaveType', width: 80, align: 'left' },
      { label: 'ลามาแล้ว', field: 'previousDays', width: 55, align: 'center' },
      { label: 'ลาครั้งนี้', field: 'currentDays', width: 50, align: 'center' },
      { label: 'รวมเป็น', field: 'totalDays', width: 50, align: 'center' },
    ],
    tableRows: 3,
    tableHeaderBold: true,
    tableHeaderBg: '#f3f4f6',
  }),
  element('text', 44, 688, 235, 20, 'ลงชื่อ {{inspector_signature}} ผู้ตรวจสอบ', { fontSize: 13, textAlign: 'center' }),
  element('text', 44, 712, 235, 20, 'ตำแหน่ง {{inspector_position}}', { fontSize: 13, textAlign: 'center' }),
  element('text', 44, 736, 235, 20, 'วันที่ {{inspection_date}}', { fontSize: 13, textAlign: 'center' }),

  element('heading', 316, 516, 234, 24, 'ความเห็นของผู้บังคับบัญชา', { fontSize: 16, fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline' }),
  element('text', 316, 548, 234, 72, '{{supervisor_comment}}', { fontSize: 14 }),
  element('text', 316, 626, 234, 20, 'ลงชื่อ {{supervisor_signature}}', { fontSize: 13, textAlign: 'center' }),
  element('text', 316, 650, 234, 20, '({{supervisor_name}})', { fontSize: 13, textAlign: 'center' }),
  element('text', 316, 674, 234, 20, 'ตำแหน่ง {{supervisor_position}}', { fontSize: 13, textAlign: 'center' }),
  element('text', 316, 698, 234, 20, 'วันที่ {{supervisor_date}}', { fontSize: 13, textAlign: 'center' }),
  element('heading', 316, 732, 234, 22, 'คำสั่ง', { fontSize: 16, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 316, 760, 234, 20, '□ อนุญาต        □ ไม่อนุญาต', { fontSize: 15, textAlign: 'center' }),
  element('text', 316, 788, 234, 20, 'ลงชื่อ {{final_approver_signature}}', { fontSize: 13, textAlign: 'center' }),
  element('text', 316, 812, 234, 18, '({{final_approver_name}})', { fontSize: 12, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'AL', isGlobal: true },
  })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารแบบฟอร์มการลางาน (AL) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-leave-request-template'
  const data = {
    name: 'ใบลาป่วย ลาคลอดบุตร ลากิจส่วนตัว',
    slug,
    description: 'เทมเพลตใบลางาน พร้อมรายละเอียดผู้ลา ประเภทและช่วงวันลา สถิติการลา ความเห็นผู้บังคับบัญชา และคำสั่งอนุมัติ',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'ใบลางาน', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
