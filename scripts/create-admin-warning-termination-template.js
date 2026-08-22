const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const warningPage = 'warning-letter-page'
const terminationPage = 'termination-letter-page'
let sequence = 0

function element(pageId, type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `warning-termination-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 16,
    color: '#111827',
    ...extra,
  }
}

function checkboxLine(pageId, x, y, text, width = 215) {
  return [
    element(pageId, 'checkbox', x, y + 2, 16, 16, ''),
    element(pageId, 'text', x + 23, y, width, 22, text, { fontSize: 15 }),
  ]
}

const elements = [
  element(warningPage, 'heading', 45, 36, 505, 34, 'หนังสือเตือน', { fontSize: 23, fontWeight: 'bold', textAlign: 'center' }),
  element(warningPage, 'text', 75, 82, 445, 25, 'บริษัท {{company_name}}', { fontSize: 17, textAlign: 'center' }),
  element(warningPage, 'line', 130, 112, 335, 1, '', { color: '#9ca3af' }),
  element(warningPage, 'text', 48, 139, 499, 28, 'เรื่อง  การฝ่าฝืนคำสั่ง ระเบียบ หรือข้อบังคับเกี่ยวกับการทำงาน', { fontSize: 16 }),
  element(warningPage, 'text', 48, 174, 499, 28, 'เรียน  คุณ {{employee_name}}  ตำแหน่ง {{job_position}}  แผนก {{department}}', { fontSize: 16 }),
  element(warningPage, 'paragraph', 48, 218, 499, 76,
    'เนื่องด้วยเมื่อวันที่ {{incident_date}} เวลา {{incident_time}} ณ {{incident_location}} ท่านได้กระทำการฝ่าฝืนคำสั่ง ระเบียบ หรือข้อบังคับเกี่ยวกับการทำงานของบริษัท โดยมีรายละเอียดดังนี้',
    { fontSize: 16, textAlign: 'justify' }),
  ...checkboxLine(warningPage, 65, 307, 'ขาดความรับผิดชอบในหน้าที่'),
  ...checkboxLine(warningPage, 310, 307, 'หนีงานหรือละทิ้งหน้าที่ระหว่างเวลางาน'),
  ...checkboxLine(warningPage, 65, 337, 'ฝ่าฝืนระเบียบข้อบังคับของบริษัท'),
  ...checkboxLine(warningPage, 310, 337, 'ก่อการทะเลาะวิวาทในที่ทำงาน'),
  ...checkboxLine(warningPage, 65, 367, 'ขาดงานติดต่อกันโดยไม่แจ้ง'),
  ...checkboxLine(warningPage, 310, 367, 'เสพสิ่งมึนเมาในบริเวณที่ทำงาน'),
  ...checkboxLine(warningPage, 65, 397, 'เข้าทำงานสายเป็นประจำ'),
  ...checkboxLine(warningPage, 310, 397, 'เล่นการพนันในบริเวณที่ทำงาน'),
  ...checkboxLine(warningPage, 65, 427, 'เจตนาขัดคำสั่งผู้บังคับบัญชา'),
  ...checkboxLine(warningPage, 310, 427, 'ยุยง ชักชวน หรือสนับสนุนให้ฝ่าฝืน'),
  ...checkboxLine(warningPage, 65, 457, 'มีพฤติกรรมอันส่อไปในทางทุจริต'),
  ...checkboxLine(warningPage, 310, 457, 'อื่น ๆ {{other_violation}}'),
  element(warningPage, 'heading', 48, 500, 499, 24, 'รายละเอียดเหตุการณ์ / หลักฐานประกอบ', { fontSize: 16, fontWeight: 'bold' }),
  element(warningPage, 'box', 48, 530, 499, 78, '{{incident_details}}', { fontSize: 15, borderColor: '#9ca3af' }),
  element(warningPage, 'paragraph', 48, 624, 499, 72,
    'บริษัทจึงขอให้ท่านแก้ไขและปรับปรุงพฤติกรรมโดยทันที หากท่านกระทำผิดซ้ำหรือไม่ปรับปรุง บริษัทจะพิจารณาดำเนินการทางวินัยตามข้อบังคับและกฎหมายต่อไป หนังสือเตือนฉบับนี้มีผลถึงวันที่ {{warning_expiry_date}}',
    { fontSize: 16, textAlign: 'justify' }),
  element(warningPage, 'line', 330, 752, 180, 1),
  element(warningPage, 'text', 330, 760, 180, 20, '({{authorized_signatory}})', { fontSize: 14, textAlign: 'center' }),
  element(warningPage, 'text', 330, 782, 180, 20, '{{authorized_position}}', { fontSize: 14, textAlign: 'center' }),
  element(warningPage, 'line', 75, 752, 180, 1),
  element(warningPage, 'text', 75, 760, 180, 20, '({{employee_name}})', { fontSize: 14, textAlign: 'center' }),
  element(warningPage, 'text', 75, 782, 180, 20, 'ผู้รับทราบหนังสือเตือน', { fontSize: 14, textAlign: 'center' }),
  element(warningPage, 'text', 500, 814, 48, 18, 'หน้า 1/2', { fontSize: 11, textAlign: 'right', color: '#6b7280' }),

  element(terminationPage, 'heading', 45, 36, 505, 34, 'หนังสือเลิกจ้าง', { fontSize: 23, fontWeight: 'bold', textAlign: 'center' }),
  element(terminationPage, 'text', 75, 82, 445, 25, 'บริษัท {{company_name}}', { fontSize: 17, textAlign: 'center' }),
  element(terminationPage, 'text', 360, 123, 185, 24, 'วันที่ {{letter_date}}', { fontSize: 16 }),
  element(terminationPage, 'text', 48, 162, 499, 28, 'เรื่อง  แจ้งเลิกจ้างและสิ้นสุดสภาพการเป็นพนักงาน', { fontSize: 16 }),
  element(terminationPage, 'text', 48, 198, 499, 28, 'เรียน  คุณ {{employee_name}}  รหัสพนักงาน {{employee_code}}', { fontSize: 16 }),
  element(terminationPage, 'paragraph', 48, 242, 499, 76,
    'ตามที่ท่านปฏิบัติงานกับบริษัทในตำแหน่ง {{job_position}} แผนก {{department}} ตั้งแต่วันที่ {{employment_start_date}} นั้น บริษัทขอแจ้งให้ท่านทราบว่าสัญญาจ้างและสภาพการเป็นพนักงานของท่านจะสิ้นสุดลง โดยมีผลตั้งแต่วันที่ {{termination_effective_date}} เป็นต้นไป',
    { fontSize: 16, textAlign: 'justify' }),
  element(terminationPage, 'heading', 48, 330, 499, 24, 'เหตุผลการเลิกจ้าง', { fontSize: 17, fontWeight: 'bold' }),
  ...checkboxLine(terminationPage, 65, 364, 'ครบกำหนดระยะเวลาตามสัญญา', 220),
  ...checkboxLine(terminationPage, 320, 364, 'ผลการปฏิบัติงานไม่ผ่านเกณฑ์', 215),
  ...checkboxLine(terminationPage, 65, 394, 'ปรับโครงสร้างหรือยุบตำแหน่ง', 220),
  ...checkboxLine(terminationPage, 320, 394, 'ฝ่าฝืนข้อบังคับเกี่ยวกับการทำงาน', 215),
  ...checkboxLine(terminationPage, 65, 424, 'สิ้นสุดการทดลองงาน', 220),
  ...checkboxLine(terminationPage, 320, 424, 'อื่น ๆ {{termination_reason_other}}', 215),
  element(terminationPage, 'box', 48, 466, 499, 70, '{{termination_reason_details}}', { fontSize: 15, borderColor: '#9ca3af' }),
  element(terminationPage, 'heading', 48, 552, 499, 24, 'สิทธิประโยชน์และการส่งมอบงาน', { fontSize: 17, fontWeight: 'bold' }),
  element(terminationPage, 'paragraph', 48, 584, 499, 90,
    'บริษัทจะชำระค่าจ้างคงค้าง ค่าจ้างแทนการบอกกล่าวล่วงหน้า ค่าชดเชย ค่าพักร้อนคงเหลือ และสิทธิประโยชน์อื่น (ถ้ามี) ตามกฎหมายและระเบียบของบริษัท รวมเป็นเงิน {{final_payment_amount}} บาท ภายในวันที่ {{final_payment_date}} ทั้งนี้ ขอให้ท่านส่งมอบงาน เอกสาร และทรัพย์สินของบริษัทให้ครบถ้วนภายในวันที่ {{handover_date}}',
    { fontSize: 16, textAlign: 'justify' }),
  element(terminationPage, 'paragraph', 48, 684, 499, 48, 'จึงเรียนมาเพื่อทราบ และขอขอบคุณสำหรับการปฏิบัติงานที่ผ่านมา', { fontSize: 16, textAlign: 'justify' }),
  element(terminationPage, 'line', 330, 770, 180, 1),
  element(terminationPage, 'text', 330, 778, 180, 20, '({{authorized_signatory}})', { fontSize: 14, textAlign: 'center' }),
  element(terminationPage, 'text', 330, 800, 180, 20, '{{authorized_position}}', { fontSize: 14, textAlign: 'center' }),
  element(terminationPage, 'line', 75, 770, 180, 1),
  element(terminationPage, 'text', 75, 778, 180, 20, '({{employee_name}})', { fontSize: 14, textAlign: 'center' }),
  element(terminationPage, 'text', 75, 800, 180, 20, 'ผู้รับทราบหนังสือเลิกจ้าง', { fontSize: 14, textAlign: 'center' }),
  element(terminationPage, 'text', 500, 814, 48, 18, 'หน้า 2/2', { fontSize: 11, textAlign: 'right', color: '#6b7280' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { name: 'หนังสือเตือน / หนังสือเลิกจ้าง', isGlobal: true },
  })

  if (!documentType) throw new Error('ไม่พบประเภทเอกสารหนังสือเตือน / หนังสือเลิกจ้างในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-warning-termination-letter-template'
  const data = {
    name: 'หนังสือเตือน / หนังสือเลิกจ้าง',
    slug,
    description: 'เทมเพลตงานบุคคล 2 หน้า ประกอบด้วยหนังสือเตือนพร้อมรายการความผิดและหนังสือเลิกจ้างพร้อมเหตุผล สิทธิประโยชน์ การส่งมอบงาน และช่องลงนามรับทราบ',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [
        { id: warningPage, name: 'หนังสือเตือน', order: 1, width: 595, height: 842, background: '#ffffff' },
        { id: terminationPage, name: 'หนังสือเลิกจ้าง', order: 2, width: 595, height: 842, background: '#ffffff' },
      ],
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
