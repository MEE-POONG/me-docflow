const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const page1 = 'employment-contract-page-1'
const page2 = 'employment-contract-page-2'
const page3 = 'employment-contract-page-3'
let sequence = 0

function element(pageId, type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `employment-contract-${sequence}`,
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

const elements = [
  element(page1, 'heading', 45, 42, 505, 38, 'สัญญาจ้างงาน', { fontSize: 23, fontWeight: 'bold', textAlign: 'center' }),
  element(page1, 'text', 330, 105, 215, 24, 'ทำที่ {{contract_place}}', { fontSize: 16, textAlign: 'left' }),
  element(page1, 'text', 330, 141, 215, 24, 'วันที่ {{contract_date}}', { fontSize: 16, textAlign: 'left' }),
  element(page1, 'paragraph', 48, 205, 499, 50, 'สัญญาฉบับนี้ทำขึ้นระหว่าง', { fontSize: 16, textAlign: 'justify' }),
  element(page1, 'paragraph', 48, 255, 499, 112,
    'บริษัท/นายจ้าง {{employer_name}} เลขทะเบียนนิติบุคคล {{employer_tax_id}} ตั้งอยู่เลขที่ {{employer_address}} โดย {{employer_representative}} ตำแหน่ง {{employer_representative_position}} ผู้มีอำนาจลงนามผูกพัน ซึ่งต่อไปในสัญญานี้เรียกว่า “นายจ้าง” ฝ่ายหนึ่ง กับ',
    { fontSize: 16, textAlign: 'justify' }),
  element(page1, 'paragraph', 48, 380, 499, 132,
    'นาย/นาง/นางสาว {{employee_name}} อายุ {{employee_age}} ปี เลขประจำตัวประชาชน {{employee_id_number}} อยู่บ้านเลขที่ {{employee_address}} โทรศัพท์ {{employee_phone}} ซึ่งต่อไปในสัญญานี้เรียกว่า “ลูกจ้าง” อีกฝ่ายหนึ่ง',
    { fontSize: 16, textAlign: 'justify' }),
  element(page1, 'paragraph', 48, 528, 499, 48, 'ทั้งสองฝ่ายตกลงทำสัญญาจ้างงานกัน โดยมีเงื่อนไขดังต่อไปนี้', { fontSize: 16, textAlign: 'justify' }),
  element(page1, 'heading', 48, 590, 499, 26, '1. การจ้างงานและตำแหน่งงาน', { fontSize: 18, fontWeight: 'bold' }),
  element(page1, 'paragraph', 62, 624, 485, 80,
    '1.1 นายจ้างตกลงจ้างและลูกจ้างตกลงเข้าทำงานในตำแหน่ง {{job_position}} แผนก/ฝ่าย {{department}} โดยมีหน้าที่และความรับผิดชอบตามเอกสารคำบรรยายลักษณะงาน (Job Description) และคำสั่งอันชอบด้วยกฎหมายของนายจ้าง',
    { fontSize: 16, textAlign: 'justify' }),
  element(page1, 'paragraph', 62, 710, 485, 58,
    '1.2 สถานที่ปฏิบัติงานหลักคือ {{work_location}} หรือตามสถานที่อื่นที่นายจ้างมอบหมายโดยสมเหตุสมผล',
    { fontSize: 16, textAlign: 'justify' }),
  element(page1, 'heading', 48, 780, 499, 26, '2. ระยะเวลาการจ้างงาน', { fontSize: 18, fontWeight: 'bold' }),
  element(page1, 'text', 500, 814, 48, 18, 'หน้า 1/3', { fontSize: 11, textAlign: 'right', color: '#6b7280' }),

  element(page2, 'heading', 45, 38, 505, 30, 'สัญญาจ้างงาน', { fontSize: 19, fontWeight: 'bold', textAlign: 'center' }),
  element(page2, 'paragraph', 48, 82, 499, 66,
    '2.1 สัญญานี้มีผลตั้งแต่วันที่ {{employment_start_date}} เป็นต้นไป โดยให้เลือกประเภทการจ้างดังต่อไปนี้',
    { fontSize: 16, textAlign: 'justify' }),
  element(page2, 'checkbox', 65, 150, 18, 18, ''),
  element(page2, 'text', 90, 146, 440, 26, 'สัญญาจ้างแบบไม่มีกำหนดระยะเวลา (พนักงานประจำ)', { fontSize: 16 }),
  element(page2, 'checkbox', 65, 184, 18, 18, ''),
  element(page2, 'text', 90, 180, 440, 45, 'สัญญาจ้างแบบมีกำหนดระยะเวลา สิ้นสุดวันที่ {{employment_end_date}}', { fontSize: 16 }),
  element(page2, 'paragraph', 48, 232, 499, 62,
    '2.2 ระยะทดลองงาน {{probation_days}} วัน โดยนายจ้างจะประเมินผลตามหลักเกณฑ์และกฎหมายที่เกี่ยวข้อง',
    { fontSize: 16, textAlign: 'justify' }),
  element(page2, 'heading', 48, 306, 499, 26, '3. ค่าจ้าง ค่าตอบแทน และสวัสดิการ', { fontSize: 18, fontWeight: 'bold' }),
  element(page2, 'paragraph', 62, 340, 485, 96,
    '3.1 นายจ้างตกลงจ่ายค่าจ้างจำนวน {{monthly_salary}} บาทต่อเดือน ชำระในวันที่ {{salary_payment_day}} ของแต่ละเดือน โดยโอนเข้าบัญชีธนาคารที่ลูกจ้างแจ้งไว้ ทั้งนี้ให้หักภาษี เงินสมทบ และรายการอื่นตามกฎหมาย',
    { fontSize: 16, textAlign: 'justify' }),
  element(page2, 'paragraph', 62, 442, 485, 76,
    '3.2 ลูกจ้างมีสิทธิได้รับสวัสดิการ {{employee_benefits}} ตามระเบียบของนายจ้างที่ประกาศใช้ในแต่ละช่วงเวลา',
    { fontSize: 16, textAlign: 'justify' }),
  element(page2, 'heading', 48, 530, 499, 26, '4. วันและเวลาทำงาน วันหยุด และวันลา', { fontSize: 18, fontWeight: 'bold' }),
  element(page2, 'paragraph', 62, 564, 485, 92,
    '4.1 เวลาทำงานปกติ {{working_days}} ตั้งแต่เวลา {{work_start_time}} ถึง {{work_end_time}} รวมเวลาพักตามที่นายจ้างกำหนด การทำงานล่วงเวลาให้เป็นไปตามกฎหมายและต้องได้รับอนุมัติก่อน',
    { fontSize: 16, textAlign: 'justify' }),
  element(page2, 'paragraph', 62, 662, 485, 70,
    '4.2 วันหยุดประจำสัปดาห์ วันหยุดตามประเพณี และสิทธิการลา ให้เป็นไปตามกฎหมายและระเบียบการทำงานของนายจ้าง',
    { fontSize: 16, textAlign: 'justify' }),
  element(page2, 'heading', 48, 744, 499, 26, '5. หน้าที่และการปฏิบัติตามระเบียบ', { fontSize: 18, fontWeight: 'bold' }),
  element(page2, 'paragraph', 62, 778, 485, 40, 'ลูกจ้างตกลงปฏิบัติหน้าที่ด้วยความสุจริต รอบคอบ และรักษาผลประโยชน์ของนายจ้าง', { fontSize: 15, textAlign: 'justify' }),
  element(page2, 'text', 500, 814, 48, 18, 'หน้า 2/3', { fontSize: 11, textAlign: 'right', color: '#6b7280' }),

  element(page3, 'heading', 45, 38, 505, 30, 'สัญญาจ้างงาน', { fontSize: 19, fontWeight: 'bold', textAlign: 'center' }),
  element(page3, 'paragraph', 48, 82, 499, 76,
    'ลูกจ้างต้องปฏิบัติตามข้อบังคับเกี่ยวกับการทำงาน นโยบายความปลอดภัย จริยธรรม การคุ้มครองข้อมูลส่วนบุคคล และคำสั่งอันชอบด้วยกฎหมาย รวมถึงดูแลทรัพย์สินของนายจ้างมิให้สูญหายหรือเสียหาย',
    { fontSize: 16, textAlign: 'justify' }),
  element(page3, 'heading', 48, 170, 499, 26, '6. การรักษาความลับและทรัพย์สินทางปัญญา', { fontSize: 18, fontWeight: 'bold' }),
  element(page3, 'paragraph', 62, 204, 485, 92,
    'ลูกจ้างตกลงรักษาข้อมูลความลับ ข้อมูลลูกค้า ข้อมูลธุรกิจ และข้อมูลส่วนบุคคลที่ได้รับจากการทำงาน ไม่เปิดเผยหรือใช้เพื่อประโยชน์อื่น เว้นแต่ได้รับอนุญาตหรือเป็นหน้าที่ตามกฎหมาย ภาระดังกล่าวยังคงมีผลภายหลังสิ้นสุดการจ้าง',
    { fontSize: 16, textAlign: 'justify' }),
  element(page3, 'heading', 48, 308, 499, 26, '7. การสิ้นสุดสัญญา', { fontSize: 18, fontWeight: 'bold' }),
  element(page3, 'paragraph', 62, 342, 485, 94,
    'การบอกเลิกสัญญา การจ่ายค่าจ้างแทนการบอกกล่าวล่วงหน้า ค่าชดเชย และการคืนทรัพย์สินของนายจ้าง ให้เป็นไปตามกฎหมาย ข้อบังคับเกี่ยวกับการทำงาน และเงื่อนไขที่ทั้งสองฝ่ายตกลงโดยชอบด้วยกฎหมาย',
    { fontSize: 16, textAlign: 'justify' }),
  element(page3, 'heading', 48, 448, 499, 26, '8. ข้อตกลงทั่วไป', { fontSize: 18, fontWeight: 'bold' }),
  element(page3, 'paragraph', 62, 482, 485, 88,
    'การแก้ไขเพิ่มเติมสัญญานี้ต้องทำเป็นลายลักษณ์อักษรและลงนามโดยทั้งสองฝ่าย หากข้อกำหนดใดใช้บังคับไม่ได้ ให้ข้อกำหนดส่วนที่เหลือยังคงมีผล สัญญานี้อยู่ภายใต้กฎหมายไทย',
    { fontSize: 16, textAlign: 'justify' }),
  element(page3, 'paragraph', 48, 580, 499, 66,
    'คู่สัญญาได้อ่านและเข้าใจข้อความทั้งหมดแล้ว เห็นว่าถูกต้องตรงตามเจตนา จึงลงลายมือชื่อไว้เป็นหลักฐานต่อหน้าพยาน',
    { fontSize: 16, textAlign: 'justify' }),
  element(page3, 'line', 72, 700, 190, 1),
  element(page3, 'line', 333, 700, 190, 1),
  element(page3, 'text', 72, 710, 190, 22, '({{employer_representative}})', { fontSize: 15, textAlign: 'center' }),
  element(page3, 'text', 333, 710, 190, 22, '({{employee_name}})', { fontSize: 15, textAlign: 'center' }),
  element(page3, 'text', 72, 734, 190, 22, 'นายจ้าง / ผู้มีอำนาจลงนาม', { fontSize: 14, textAlign: 'center' }),
  element(page3, 'text', 333, 734, 190, 22, 'ลูกจ้าง', { fontSize: 14, textAlign: 'center' }),
  element(page3, 'line', 105, 790, 130, 1),
  element(page3, 'line', 360, 790, 130, 1),
  element(page3, 'text', 90, 798, 160, 20, 'พยานฝ่ายนายจ้าง', { fontSize: 13, textAlign: 'center' }),
  element(page3, 'text', 345, 798, 160, 20, 'พยานฝ่ายลูกจ้าง', { fontSize: 13, textAlign: 'center' }),
  element(page3, 'text', 500, 814, 48, 18, 'หน้า 3/3', { fontSize: 11, textAlign: 'right', color: '#6b7280' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { name: 'สัญญาจ้างงาน', isGlobal: true },
  })

  if (!documentType) throw new Error('ไม่พบประเภทเอกสารสัญญาจ้างงานในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-employment-contract-template'
  const data = {
    name: 'สัญญาจ้างงาน / Employment Contract',
    slug,
    description: 'เทมเพลตสัญญาจ้างงาน 3 หน้า พร้อมข้อมูลนายจ้างและลูกจ้าง ตำแหน่ง ระยะเวลาจ้าง ค่าตอบแทน เวลาทำงาน หน้าที่ การรักษาความลับ การสิ้นสุดสัญญา และช่องลงนาม',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [
        { id: page1, name: 'สัญญาจ้างงาน หน้า 1', order: 1, width: 595, height: 842, background: '#ffffff' },
        { id: page2, name: 'สัญญาจ้างงาน หน้า 2', order: 2, width: 595, height: 842, background: '#ffffff' },
        { id: page3, name: 'สัญญาจ้างงาน หน้า 3', order: 3, width: 595, height: 842, background: '#ffffff' },
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
